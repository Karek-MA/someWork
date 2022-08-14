/*!
 * @license
 * Copyright 2016 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { SitesService } from '@alfresco/adf-core';
import { MinimalNodeEntity, Site } from '@alfresco/js-api';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { FoldersService } from 'app/services/folders.service';
import { PreviewService } from 'app/services/preview.service';


@Component({
  selector: 'app-layout',
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.scss']
})
export class AppLayoutComponent implements OnInit {

  folders:Site [] = []
  sites:Site [] = []
  subFolders:Site [] = []
  sitesID:string [] = []
  documentLibrary:Site [] = []
  userFlow: boolean = true;
  currentFolderID: string = ""
  currentSite: string = ""



  constructor(private foldersService:FoldersService ,private router: Router,private preview: PreviewService) {


  }
  ngOnInit(): void {


    // this.sitesService.getSites().subscribe(

    //   (res)=>{
    //     console.log("sites: "+  res.list.entries)
    //      res.list.entries.forEach(s=> this.sites.push(s.entry))
    //     console.log(this.sites)

    //   }

    // )
  }
  onSearchSubmit(event: KeyboardEvent) {
    const value = (event.target as HTMLInputElement).value;
    this.router.navigate(['/search', {
        q: value
    }]);
}

onItemClicked(event: MinimalNodeEntity) {
    if (event.entry.isFile) {
        this.preview.showResource(event.entry.id);
    } else if (event.entry.isFolder) {
      this.setCurrentFolderID(event.entry.id);
      this.currentSite = event.entry.id
      //this.currentFolderID = event.entry.id
        //this.router.navigate(['/', event.entry.id]);
    }
}

getDocumentLibrary(id){
this.folders =[]
this.currentSite = id
    this.foldersService.getFoldersInSite(id).subscribe(
      (res)=>{
        this.documentLibrary=[];
         res.list.entries.forEach(s=> this.documentLibrary.push(s.entry))
        // console.log(this.documentLibrary)
         this.documentLibrary.forEach(f=> this.getFolders(f.id))

      }

    );

  }

  getFolders(id){

    this.folders =[]


    this.foldersService.getFoldersInSite(id).subscribe(
      (res)=>{
        this.folders =[]

         res.list.entries.forEach(s=>
          {
            if(s.entry.isFolder){
              this.folders.push(s.entry)
            }
          }
          )


      }

    );

  }

  getSubFolders(id){
    this.subFolders =[];
    this.foldersService.getFoldersInSite(id).subscribe(
      (res)=>{
        this.subFolders =[];
         res.list.entries.forEach(s=>
          {
            if(s.entry.isFolder){
              this.subFolders.push(s.entry)
            }

          }

          )


      }

    );

  }


  setCurrentFolderID(id){
   // console.log("the current ID of the clicked FOLDER is :  "+ id);
    this.currentFolderID = id

    // this.router.navigate(['/']);
    // this.router.navigate(['/documents']);
    // this.documentLiberary=[];
    // this.folders=[];
    // this.subFolders=[];
  }
  reSetFolders(){
    this.currentFolderID = '';
    this.currentSite='';
  }


}
