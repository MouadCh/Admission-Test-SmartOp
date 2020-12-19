export class MyModel{
    surgeon         : string;
    specialty       : string;
    anesthesiste    : string;
    nurse           : string;
    roomNumber      : string;
    intervention    : string;
    interventions   : number;


    constructor(surgeon: string, specialty: string, anesthesiste: string, nurse: string, roomNumber: string, intervention: string, interventions: number) {
        this.surgeon        = surgeon;
        this.specialty      = specialty;
        this.anesthesiste   = anesthesiste;
        this.nurse          = nurse;
        this.roomNumber     = roomNumber;
        this.intervention   = intervention;
        this.interventions  = interventions;
      }

}