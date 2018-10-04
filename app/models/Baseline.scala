
package models


import squants.energy._
import squants.space._
import scala.concurrent.Future
import scala.language._
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global
import squants.Energy



case class EUIMetrics(parameters: JsValue) {


  val result = parameters.as[List[JsValue]]


  val modelEUI = ModelValues(result.head)


  def getTotalEUIBreakdownList:Future[Seq[Map[String,Any]]] = {
    for {
      propList <- modelEUI.getValidatedPropList
      modelBreakdowns <- Future.sequence(propList.map{modelEUI.lookupEndUses(_,None)})
    } yield {
      val test = (propList,modelBreakdowns)
        .zipped.map{
        case (a,b) => Map(
          "building_name" -> a.building_name,
          "building_type" -> a.building_type,
          "floor_area" -> a.floor_area.value,
          "eui_breakdown" -> b
        )
      }
      println(test)
      test
    }
  }

  def getEndUses:Future[Seq[Map[String,Any]]] = {


    for {
      propList <- modelEUI.getValidatedPropList
      modelEui <- Future.sequence(propList.map{modelEUI.lookupEndUses(_,None)})
      modelEnergy <- Future.sequence(propList.map{modelEUI.lookupModelEndUseEnergies(_)})
      modelTotalEUI <- Future.sequence(propList.map{modelEUI.lookupModelTotalMetricIntensity(_)})


    } yield {
      val test = (propList,modelEui,modelEnergy)
        .zipped.map{
        case (a,b,c) => Map(
          "building_name" -> a.building_name,
          "building_type" -> a.building_type,
          "floor_area" -> a.floor_area.value,
          "eui_breakdown" -> b,
          "energy_breakdown" -> c
        )
      }
      test
    }
  }

  def getTotalEnergyBreakdownList:Future[Seq[Map[String,Any]]] = {
    for {
      propList <- modelEUI.getValidatedPropList
      modelBreakdowns <- Future.sequence(propList.map{modelEUI.lookupModelEndUseEnergies(_)})
    } yield {
      (propList,modelBreakdowns).zipped.map{
        case (a,b) => Map(
          "building_name" -> a.building_name,
          "building_type" -> a.building_type,
          "floor_area" -> a.floor_area.value,
          "energy_breakdown" -> b
        )
      }
    }
  }

  def getTotalEUIPercentsList:Future[Seq[Map[String,Any]]] = {
    for {
      propList <- modelEUI.getValidatedPropList
      modelBreakdowns <- Future.sequence(propList.map {
        modelEUI.lookupModelEndUsePercents(_)
      })
    } yield {
      (propList, modelBreakdowns).zipped.map {
        case (a,b) => Map(
          "building_name" -> a.building_name,
          "building_type" -> a.building_type,
          "floor_area" -> a.floor_area.value,
          "eui" -> b
        )
      }
    }
  }


  def getTotalEUIList:Future[List[Map[String,Any]]] = {
    for {
      propList <- modelEUI.getValidatedPropList
      modelTotalEUI <- Future.sequence(propList.map{modelEUI.lookupModelTotalMetricIntensity(_)})
    } yield {
      (propList,modelTotalEUI).zipped.map{
        case (a,b) => Map(
          "building_name" -> a.building_name,
          "building_type" -> a.building_type,
          "floor_area" -> a.floor_area.value,
          "eui" -> b
        )
      }
    }
  }

  def getTotalEnergyList(): Future[List[Map[String,Any]]] = {
    for {
      propList <- modelEUI.getValidatedPropList
      areaList:List[Double] <- Future{propList.map(_.floor_area.value)}
      energyList:List[Energy] <- Future.sequence(propList.map{modelEUI.lookupModelTotalMetricIntensity(_)})
      energyList:List[Energy] <- Future{(areaList,energyList).zipped.map(_*_)}

    } yield {
      (propList,energyList).zipped.map{
        case (a,b) => Map(
          "building_name" -> a.building_name,
          "building_type" -> a.building_type,
          "floor_area" -> a.floor_area.value,
          "energy" -> b
        )
      }
    }
  }


  def getTotalEUIBaseList:Future[List[Map[String,Any]]] = {
    for {
      propList <- modelEUI.getValidatedPropList
      modelTotalEUI <- Future.sequence(propList.map{modelEUI.lookupModelTotalBaseIntensity(_)})
    } yield {
      (propList,modelTotalEUI).zipped.map{
        case (a,b) => Map(
          "building_name" -> a.building_name,
          "building_type" -> a.building_type,
          "floor_area" -> a.floor_area.value,
          "eui" -> b
        )
      }
    }
  }

  def getEUIDiff(): Future[List[Map[String,Any]]] = {
    for {
      propList <- modelEUI.getValidatedPropList

      modelTotalBaseEUI:List[Energy] <- Future.sequence(propList.map{modelEUI.lookupModelTotalBaseIntensity(_)})
      modelTotalEUI:List[Energy] <- Future.sequence(propList.map{modelEUI.lookupModelTotalMetricIntensity(_)})

      modelEUI <- Future.sequence(propList.map{modelEUI.lookupModelTotalBaseIntensity(_)})

      differenceEUIList:List[Energy] <- Future{(modelTotalBaseEUI,modelTotalEUI).zipped.map(_-_)}

    } yield {
      (propList,differenceEUIList,modelEUI).zipped.map{
        case (a,b,c) => Map(
          "building_name" -> a.building_name,
          "eui_diff" -> b.value,
          "eui" -> c
        )
      }
    }
  }

  def getEnergyDiff(): Future[List[Map[String,Any]]] = {
    for {
      propList <- modelEUI.getValidatedPropList

      modelTotalBaseEUI:List[Energy] <- Future.sequence(propList.map{modelEUI.lookupModelTotalBaseIntensity(_)})
      areaList:List[Double] <- Future{propList.map(_.floor_area.value)}
      energyBaseList:List[Energy] <- Future{(areaList,modelTotalBaseEUI).zipped.map(_*_)}

      modelTotalEUI:List[Energy] <- Future.sequence(propList.map{modelEUI.lookupModelTotalMetricIntensity(_)})
      areaList:List[Double] <- Future{propList.map(_.floor_area.value)}
      energyList:List[Energy] <- Future{(areaList,modelTotalEUI).zipped.map(_*_)}

      areaList:List[Double] <- Future{propList.map(_.floor_area.value)}
      energyList:List[Energy] <- Future.sequence(propList.map{modelEUI.lookupModelTotalMetricIntensity(_)})
      energyList:List[Energy] <- Future{(areaList,energyList).zipped.map(_*_)}

      differenceEnergyList:List[Energy] <- Future{(energyBaseList,energyList).zipped.map(_-_)}



    } yield {
      (propList,differenceEnergyList,energyList).zipped.map{
        case (a,b,c) => Map(
          "building_name" -> a.building_name,
          "energy_diff" -> b.value,
          "energy"->c
        )
      }
    }
  }




  //default reporting units are IMPERIAL (kbtu, square feet, ...)
  def reportingUnits: String = {
    result.head.asOpt[ReportingUnits] match {
      case Some(a) => a.reporting_units
      case _ => "imperial"
    }
  }


case class ReportingUnits(reporting_units:String)
  object ReportingUnits {
    implicit val ReportingUnitsReads: Reads[ReportingUnits] = Json.reads[ReportingUnits]
  }





// final output conversions

  def energyMetricUnit(energyEntry:Energy):Energy = energyEntry in KilowattHours
  def energyMetricConstant:Double = KBtus(1) to KilowattHours //interpret as kwh per kbtu

  def areaMetricUnit(areaEntry:Double):Double = SquareFeet(areaEntry) to SquareMeters
  def areaImperialUnit(areaEntry:Double):Double = SquareMeters(areaEntry) to SquareFeet
  def areaMetricConstant:Double = SquareFeet(1) to SquareMeters//interpret as sq meters per sq ft


  def convertEnergy(energyEntry:Energy):Future[Energy] = Future{
    //input should always be KBtus
    reportingUnits match {
      case "imperial" => energyEntry
      case "metric" => energyMetricUnit(energyEntry)
      case _ =>  throw new Exception ("Reporting Units not Identified!")
    }
  }

  def convertEUI(energyEntry:Energy,areaEntry:Double):Future[Energy] = Future{
    reportingUnits match {
      case "imperial" => energyEntry / areaEntry
      case "metric" => energyMetricUnit(energyEntry) / areaMetricUnit(areaEntry)
    }
  }

  def convertSize(areaEntry:Double, startingUnits:String):Future[Double] = Future{
    startingUnits match {
      case "imperial" => {
        reportingUnits match {
          case "imperial" => areaEntry
          case "metric" => areaMetricUnit(areaEntry)
        }
      }
      case "metric" => {
        reportingUnits match {
          case "imperial" => areaImperialUnit(areaEntry)
          case "metric" => areaEntry
        }
      }
    }
  }


}





// These classes represent data that have been populated with defaults
case class BuildingData(
                           building_type: Option[String],
                           climate_zone: Option[String],
                           floor_area: Option[Double],
                           floor_area_units: Option[String])

object BuildingData {
  implicit val BuildingDataReads: Reads[BuildingData] = Json.reads[BuildingData]
}

case class ValidatedBuildingData(
                           building_type: String,
                           climate_zone: String,
                           floor_area: Double,
                           floor_area_units: String)
