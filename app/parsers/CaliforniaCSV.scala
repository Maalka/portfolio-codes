package parsers

import akka.stream.ActorMaterializer
import java.io.{InputStream, InputStreamReader}

import akka.actor.ActorSystem
import akka.stream.scaladsl._
import com.github.tototoshi.csv.CSVReader
import javax.inject.Inject
import com.google.common.base.Charsets

import scala.collection.immutable
import scala.concurrent.{ExecutionContext, Future}


class CaliforniaCSV @Inject() (implicit val actorSystem: ActorSystem,
                               executionContext: ExecutionContext) {

  private def source(stream: Stream[Seq[String]]) = Source
    .fromIterator(() => stream.toIterator)
    .map(_.map {
      case "" => None
      case a => Some(a)
    }.toSeq)

  private def toStream(is: InputStream): Stream[Seq[String]] = {
    CSVReader.open(new InputStreamReader(is, Charsets.UTF_8))
      .toStream()
  }

  def toParameter(is: InputStream) = {
    implicit val materializer = ActorMaterializer()

    source(toStream(is)).via(parameterSegmentFlow())
      .runWith(Sink.seq)
  }

  def toProject(is:InputStream) = {
    implicit val materializer = ActorMaterializer()

    source(toStream(is)).via(projectSegmentFlow())
      .runWith(Sink.seq)
  }

  def toAnnualResults(is:InputStream) = {
    implicit val materializer = ActorMaterializer()

    source(toStream(is)).via(annualResultsSegmentFlow())
      .groupBy(1000, _.head)
      .fold(("", Vector[Vector[String]]())) {
        case (a, b) => b.head -> (a._2 :+ b)
      }
      .mergeSubstreams
      .runWith(Sink.seq)
  }

  def toHourlylResults(is:InputStream) = {
    implicit val materializer = ActorMaterializer()

    source(toStream(is))
      .via(hourlyResultsSegmentFlow())
      .runWith(Sink.seq)
  }

  private def parameterSegmentFlow() = Flow[Seq[Option[String]]]
    .statefulMapConcat { () =>
      var rowNumber = -1
      val startRowNumber = 1
      val endRowNumber = 7
      row =>
        rowNumber += 1
        if (rowNumber >= 1 && rowNumber <= endRowNumber && row(1).isDefined && row(3).isDefined) {
          scala.collection.immutable.Iterable[Option[Vector[String]]](Some(Vector(row(1).get, row(3).get)))
        } else {
          scala.collection.immutable.Iterable.empty[Option[Vector[String]]]
        }

    }
    .filter(_.isDefined)
    .map(_.get)

  private def projectSegmentFlow() = Flow[Seq[Option[String]]]
    .statefulMapConcat { () =>
      var rowNumber = -1
      val startRowNumber = 9
      val endRowNumber = 29
      row =>
        rowNumber += 1
        if (rowNumber >= startRowNumber && rowNumber <= endRowNumber && row(1).isDefined && row(5).isDefined) {
          scala.collection.immutable.Iterable[Option[Vector[String]]](Some(Vector(row(1).get, row(5).get, row(6).getOrElse(""))))
        } else {
          scala.collection.immutable.Iterable.empty[Option[Vector[String]]]
        }
    }
    .filter(_.isDefined)
    .map(_.get)

  private def generate(o: Vector[String]): String => Vector[String] = { (value: String) =>
    o :+ value
  }

  private case class MapMayColumnOption(
                                 startRowNumber: Int,

                                 endRowNumber: Int,
                                 yHeaderRow: Int,

                                 ysubHeaderRow: Int,
                                 dataRow: Int,

                                 dataColumnHeader: Int,
                                 headers: scala.collection.mutable.ListBuffer[(String, Int)],

                                 headersGenerator: scala.collection.mutable.ListBuffer[(Int, String => Vector[String])],

                                 mapKey: Seq[Option[String]] => Option[String]


                               )

  private def mapManyColumn(
                     row: Seq[Option[String]],
                     rowNumber: Int,
                     options: MapMayColumnOption): immutable.Iterable[Option[Vector[String]]] = {

    if (rowNumber >= options.startRowNumber && rowNumber <= options.endRowNumber) {
      if (rowNumber == options.yHeaderRow) {

        // grab all the headers
        // this is a row like
        // ,,,Proposed Design Site Energy,,,,Proposed Design Source Energy,,,,,Proposed Design TDV Energy,,,,
        options.headers ++= row.zipWithIndex.filter(_._1.isDefined).map {
          case (Some(k), i) => k -> i
        }

        Console.println("ddd: %s".format(options.headers))
        scala.collection.immutable.Iterable.empty[Option[Vector[String]]]

      } else if (rowNumber == options.ysubHeaderRow) {
        // grab all the header generators.
        // this is a row like
        // ,,,Electric,Gas,PV Systems,Battery,Electric,Gas,PV Systems,Battery,Total,Electric,Gas,PV Systems,Battery,Total
        var curH: (String, Int) = null

        options.headersGenerator ++= row.zipWithIndex.drop(options.headers.head._2).filter(_._1.isDefined).map {
          case (v, col) =>
            curH = options.headers.find(_._2 == col).getOrElse(curH)
            col -> generate(Vector(curH._1, v.get))
        }
        scala.collection.immutable.Iterable.empty[Option[Vector[String]]]

      } else if (rowNumber >= options.dataRow) {

        // grab the data row

        // take any values to the left of the row
        // will compile Mo,Da,Hr
        val rowH = row.zipWithIndex.takeWhile{
          case (_, i) => !options.headersGenerator.exists(_._1 == i)
        }.flatMap(_._1)

        // emit the values
        options.mapKey(row).map { h =>
          row.zipWithIndex.drop(options.dataColumnHeader).filter(_._1.isDefined).map {
            case (v, col) =>
              options.headersGenerator.find(_._1 == col).flatMap { g =>
                v.map{ r =>
                  rowH.toVector ++ Vector(h) ++ g._2(r)
                }
              }
          }.to[scala.collection.immutable.Iterable]
        }.getOrElse(
          // if this is out of bounds return nothing
          scala.collection.immutable.Iterable.empty[Option[Vector[String]]])

      } else {
        scala.collection.immutable.Iterable.empty[Option[Vector[String]]]
      }
    } else {
      scala.collection.immutable.Iterable.empty[Option[Vector[String]]]
    }
  }

  private def annualResultsSegmentFlow() = Flow[Seq[Option[String]]]
    .statefulMapConcat { () =>
      var rowNumber = -1

      val options = MapMayColumnOption(
        startRowNumber = 30,

        endRowNumber = 51,
        yHeaderRow = 30,

        ysubHeaderRow = 31,
        dataRow = 32,

        dataColumnHeader = 2,

        headers = scala.collection.mutable.ListBuffer[(String, Int)](),

        headersGenerator = scala.collection.mutable.ListBuffer[(Int, String => Vector[String])](),

        mapKey = (row: Seq[Option[String]]) => row(2)
      )

      row =>
        rowNumber += 1 // starts at -1
        mapManyColumn(row, rowNumber, options)
    }
    .filter(_.isDefined)
    .map(_.get)

  private def hourlyResultsSegmentFlow() = Flow[Seq[Option[String]]]
    .statefulMapConcat { () =>
      var rowNumber = -1

      val options = MapMayColumnOption(
        startRowNumber = 53,

        endRowNumber = 99999999,
        yHeaderRow = 53,

        ysubHeaderRow = 54,
        dataRow = 56,

        dataColumnHeader = 0,

        headers = scala.collection.mutable.ListBuffer[(String, Int)](),

        headersGenerator = scala.collection.mutable.ListBuffer[(Int, String => Vector[String])](),

        mapKey = (row: Seq[Option[String]]) => row.slice(1, 2).reduce[Option[String]] {
          case (Some(a:String), Some(b:String)) => Some(a + "-" + b)
          case _ => None
        }
      )

      row =>
        rowNumber += 1 // starts at -1
        mapManyColumn(row, rowNumber, options)
    }
    .filter(_.isDefined)
    .map(_.get)
}

