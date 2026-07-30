export enum GenderEnum {
  Male,
  Female,
  Other,
}
export enum yesnoEnum {
  Yes,
  No,
}
export enum WardNumberEnum {
  One = "1",
  Two = "2",
  Three = "3",
  Four = "4",
  Five = "5",
  Six = "6",
  Seven = "7",
  Eight = "8",
}
export enum RoadCodeEnum {
  TestA,
  TestB,
  TestC,
}

export enum StructureTypeEnum {
  CGISheet = "CGI Sheet",
  LoadBearing = "Load Bearing",
  RCCFramed = "RCC Framed",
  WoodenMug = "Wooden/Mug",
}
export enum EmptyingFieldsEnum {
  Date = "Date",
  ServiceReciverName = "Service Receiver Name",
  SelectReceiverGender = "Select Service Receiver Gender",
  ServiceReciverPhone = "Service Receiver Contact Number",
  EmptyingReason = "Reason For Emptying",
  Sludge = "Sludge Volume (L)",
  DistanceToWell = "Distance Closent To Well (m)",
  DesludginggVehicleNumber = "Select A Desludging Vehicle Number Plate",
  SelectDisposalPlace = "Select A Disposal Place",
  TreatmentPlantId = "treatment_plant_id",
  SelectDriver = "Select A Driver",
  SelectEmp1 = "Select Emptier 1",
  SelectEmp2 = "Select Emptier 2",
  StartTime = "Start Time",
  EndTime = "EndTime",
  NoOfTrips = "No. Of Trips",
  ReceiptNum = "Receipt Number",
  TotalCost = "Total Cost",
  HouseImage = "House Image",
  ReceiptImage = "Receipt Image",
  Comments = "Comments (If any)",
}
export enum FunctionalUseOfEnum {
  Agriculture = "Agricultural & Farm",
  Commercial = "Commercial",
  Community = "Community/Public Toilet",
  Culture = "Cultural & Religious",
  Education = "Educational Institution",
  Finance = "Financial Institution",
  Government = "Government Institution",
  Health = "Health",
  Industrial = "Industrial",
  Media = "Media Institution",
  Mixed = "Mixed (Residential & Commercial",
  Public = "Public Institution",
  Residential = "Residential",
  Social = "Social Institution",
  Vacant = "Vacant",
}

export const functionalUseOptionsMapping: {
  [key in FunctionalUseOfEnum]: string[];
} = {
  [FunctionalUseOfEnum.Agriculture]: [],
  [FunctionalUseOfEnum.Commercial]: [
    "Shop",
    "Restaurant",
    "Hotel",
    "Cinema",
    "Theatre",
    "Other Service Oriented Businesses",
  ],
  [FunctionalUseOfEnum.Community]: [],
  [FunctionalUseOfEnum.Culture]: [
    "Mosque",
    "Church",
    "Temple",
    "Stupa",
    "Hermitage",
  ],
  [FunctionalUseOfEnum.Education]: [],
  [FunctionalUseOfEnum.Finance]: [],
  [FunctionalUseOfEnum.Government]: [
    "Municipal Office",
    "Ward Office",
    "Government Office",
    "Police Office",
  ],
  [FunctionalUseOfEnum.Health]: [
    "Hospital",
    "Health Post",
    "Nursing Home",
    "Private Clinic",
    "Aaryurvedic Hospital",
  ],
  [FunctionalUseOfEnum.Industrial]: ["Industry", "Factory"],
  [FunctionalUseOfEnum.Media]: [],
  [FunctionalUseOfEnum.Mixed]: ["Mixed"],
  [FunctionalUseOfEnum.Public]: [
    "Club",
    "Farm",
    "City Hall",
    "Library",
    "Recreational Area",
  ],
  [FunctionalUseOfEnum.Residential]: [FunctionalUseOfEnum.Residential],
  [FunctionalUseOfEnum.Social]: ["NGO", "INGO", "Social", "Political"],
  [FunctionalUseOfEnum.Vacant]: [FunctionalUseOfEnum.Vacant],
};
export enum YesNo {
  Yes = "Yes",
  No = "No",
}
