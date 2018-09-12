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
import scala.util.{Success, Try}


class CodesCSV @Inject()(implicit val actorSystem: ActorSystem,
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


  def toPortfolio(is:InputStream) = {
    implicit val materializer = ActorMaterializer()

    source(toStream(is)).via(portfolioSegmentFlow())
      .runWith(Sink.seq)
  }

  val typeList:Seq[String]=Seq("Office","Retail","School","Restaurant","Hotel","Warehouse","Apartment")
  val unitList:Seq[String]=Seq("ftSQ","mSQ")

  def rowValid(row:Seq[Option[String]]):Boolean = {


    def tryFormat(CSVvalue:Option[String],checkType:String):Boolean = {
      checkType match {
        case "int" => {
          Try {
            CSVvalue.get.trim.toInt
          } match {
            case Success(a) => true
            case _ => false
          }
        }
        case "double" => {
          Try {
            CSVvalue.get.trim.toDouble
          } match {
            case Success(a) => true
            case _ => false
          }
        }
      }
    }

    if (row(0).isDefined && typeList.contains(row(1).getOrElse("")) && tryFormat(row(2),"double") && unitList.contains(row(3).getOrElse("")) && row(4).isDefined) {
      true
    } else {
      false
    }
  }

  private def portfolioSegmentFlow() = Flow[Seq[Option[String]]]
    .statefulMapConcat { () =>
      var rowNumber = -1
      val startRowNumber = 1
      val endRowNumber = 200
      row =>
        rowNumber += 1
        if (rowNumber >= startRowNumber && rowNumber <= endRowNumber && rowValid(row)) {
          scala.collection.immutable.Iterable[Option[Vector[String]]](Some(Vector(row(0).get, row(1).get, row(2).get, row(3).get, row(4).get)))
        } else {
          scala.collection.immutable.Iterable.empty[Option[Vector[String]]]
        }
    }
    .filter(_.isDefined)
    .map(_.get)

  private def generate(o: Vector[String]): String => Vector[String] = { (value: String) =>
    o :+ value
  }



}

