import { AuthenticationService } from '@alfresco/adf-core';
import {  HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
//import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class ActivitiesService {
  baseUrl="http://localhost:8080/alfresco/api/-default-/public/alfresco/versions/1";
  ticket:string ;

  constructor(private http: HttpClient,private authenticationService: AuthenticationService ) {


  }



  getActivities(id:string, siteId:string): Observable<any>{
    this.ticket = this.authenticationService.getTicketEcm();
    let  httpParams = new HttpParams().set("alf_ticket",this.ticket);

    const specificRoute="/people/"+id+"/activities?siteId="+siteId;
   // console.log(specificRoute+"  "+this.ticket)
    return this.http.get<any>(this.baseUrl+specificRoute,{params : httpParams})
  }

  }
