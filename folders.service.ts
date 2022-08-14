import { AuthenticationService } from '@alfresco/adf-core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class FoldersService {
  baseUrl="http://localhost:8080/alfresco/api/-default-/public/alfresco/versions/1";
  ticket:string ;
  constructor(private http: HttpClient,private authenticationService: AuthenticationService ) {

   }


  getFoldersInSite(id): Observable<any>{

    this.ticket = this.authenticationService.getTicketEcm();
    let  httpParams = new HttpParams().set("alf_ticket",this.ticket);
    const specificRoute="/nodes/"+id+"/children";
    return this.http.get<any>(this.baseUrl+specificRoute,{params : httpParams})


  }
}
