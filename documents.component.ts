import { Component, ViewChild, Input, OnInit, EventEmitter, Output, Optional } from '@angular/core';
import { AppConfigService, AppConfigValues, AuthenticationService, ContentService, DataRow, DisplayMode, FileUploadEvent, FolderCreatedEvent, FormValues, InfinitePaginationComponent, LogService, NodesApiService, NotificationService, SharedLinksApiService, UploadService, UserPreferencesService } from '@alfresco/adf-core';
import { AspectListService, ConfirmDialogComponent, ContentMetadataService, DocumentListComponent, FilterSearch, PermissionStyleModel, UploadFilesEvent } from '@alfresco/adf-content-services';
import { PreviewService } from 'app/services/preview.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Location } from '@angular/common';
import { MinimalNodeEntity, MinimalNodeEntryEntity, NodeEntry, NodePaging, Pagination } from '@alfresco/js-api';
import { MetadataDialogAdapterComponent } from './metadata-dialog-adapter.component';
import { MatDialog } from '@angular/material/dialog';

import { VersionManagerDialogAdapterComponent } from './version-manager-dialog-adapter.component';
import { debounceTime, scan, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ThemePalette } from '@angular/material/core';
import { PermissionsComponent } from 'app/permissions/permissions.component';
import { CommentsComponent } from 'app/comments/comments.component';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrls: ['./document.component.scss']
})
export class DocumentsComponent implements OnInit {

  protected onDestroy$ = new Subject<boolean>();
  preselectNodes: boolean;
  @Output()
    deleteElementSuccess: EventEmitter<any> = new EventEmitter();
    @Output()
    documentListReady: EventEmitter<any> = new EventEmitter();
    @Input()
    showVersionComments = true;
    @ViewChild(InfinitePaginationComponent, { static: true })
    infinitePaginationComponent: InfinitePaginationComponent;
    @Input()
    disableDragArea = false;
    @Input()
    allowVersionDownload = true;
    @Input()
    acceptedFilesTypeShow = false;
    @Input()


    formValues: FormValues = {};
    enableCustomPermissionMessage = false;
    @Input()
    enableUpload = true;
    @Input()
    selectionMode = 'multiple';
    @Input()
    searchTerm = '';
    processId;
  @Input()
  showViewer = false;
  @Input()
  navigationRoute = '/fond-documentaire';
  @Input()
  versioning = false;
  @Input()
  nodeResult: NodePaging;
  nodeId: string = null;
  @Input() currentFolderID: string = " "
  @Input() currentSite: string = ""
  @Input()
  acceptedFilesType = '.jpg,.pdf,.js';
  @Input()
  pagination: Pagination;
  @ViewChild('documentList')
  documentList: DocumentListComponent;
  displayMode = DisplayMode.List;
  warnOnMultipleUploads = false;
  showVersions = false;
  errorMessage: string = null;
  stickyHeader: boolean = false;
  allowDropFiles = true;
  infiniteScrolling: boolean;
  enableMediumTimeFormat = false;
  thumbnails = false;
  displayEmptyMetadata = false;
  permissionsStyle: PermissionStyleModel[] = [];
  includeFields = ['isFavorite', 'isLocked', 'aspectNames', 'definition'];


 toolbarColor: ThemePalette;


  selectedNodes = [];
  baseShareUrl = (
    this.appConfig.get<string>(AppConfigValues.BASESHAREURL) ||
    this.appConfig.get<string>(AppConfigValues.ECMHOST)) + '/preview/s/';
  constructor(private notificationService: NotificationService,
    private location: Location,
    private contentService: ContentService,
    private uploadService: UploadService,
    private logService: LogService,
    private nodeService: NodesApiService,
    private sharedLinksApiService: SharedLinksApiService,
    private aspectListService: AspectListService,
    private contentMetadataService: ContentMetadataService,
    public authenticationService: AuthenticationService,
    private preference: UserPreferencesService,
    @Optional() private route: ActivatedRoute,
    private dialog: MatDialog,
    private appConfig: AppConfigService,

    private router: Router, private preview: PreviewService) {
  }
  ngOnInit(): void {

    if (!this.pagination) {
      this.pagination = {
          maxItems: this.preference.paginationSize,
          skipCount: 0
      } as Pagination;
  }
  if (this.route) {
    this.route.params.forEach((params: Params) => {
        if (params['id'] && this.currentFolderID !== params['id']) {
            this.currentFolderID = params['id'];
        }

        if (params['mode'] && params['mode'] === DisplayMode.Gallery) {
            this.displayMode = DisplayMode.Gallery;
        }
    });
  }


  this.uploadService.fileUploadComplete
  .pipe(
      debounceTime(300),
      scan((files, currentFile) => [...files, currentFile], []),
      takeUntil(this.onDestroy$)
  )
  .subscribe((value: any[]) => {
      let selectedNodes: NodeEntry[] = [];

      if (this.preselectNodes) {
          if (value && value.length > 0 ) {

                  selectedNodes = [...value.map((uploadedFile) => uploadedFile.data)];

              this.selectedNodes = [...selectedNodes];
          }
      }

      this.onFileUploadEvent(value[0]);
  });
  this.uploadService.fileUploadDeleted
  .pipe(takeUntil(this.onDestroy$))
  .subscribe(value => this.onFileUploadEvent(value));

  this.contentService.folderCreated
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(value => this.onFolderCreated(value));

  this.contentService.folderCreate
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(value => this.onFolderAction(value));

  this.contentService.folderEdit
      .pipe(takeUntil(this.onDestroy$))
      .subscribe(value => this.onFolderAction(value));

  this.contentMetadataService.error
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((err: { message: string }) => {
          this.notificationService.showError(err.message);
      });

  this.sharedLinksApiService.error
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((err: { message: string }) => {
          this.notificationService.showError(err.message);
      });


  }
  onFileUploadEvent(event: FileUploadEvent) {
    if (event && event.file.options.parentId === this.documentList.currentFolderId) {
        this.documentList.reload();
    }
}
  ngOnDestroy() {
    this.onDestroy$.next(true);
    this.onDestroy$.complete();
}

  uploadSuccess() {
    this.notificationService.openSnackMessage('File uploaded');
    this.documentList.reload();
  }
  onBeginUpload(event: UploadFilesEvent) {
    if (this.warnOnMultipleUploads && event) {
        const files = event.files || [];
        if (files.length > 1) {
            event.pauseUpload();

            const dialogRef = this.dialog.open(ConfirmDialogComponent, {
                data: {
                    title: 'Upload',
                    message: `Are you sure you want to upload ${files.length} file(s)?`
                },
                minWidth: '250px'
            });

            dialogRef.afterClosed().subscribe((result) => {
                if (result === true) {
                    event.resumeUpload();
                }
            });
        }
    }
}
onFolderCreated(event: FolderCreatedEvent) {
  this.logService.log('FOLDER CREATED');
  this.logService.log(event);
  if (event && event.parentId === this.documentList.currentFolderId) {
      this.documentList.reload();
  }
}
onFolderAction(node) {
  this.logService.log(node);
  if (node && node.parentId === this.documentList.currentFolderId) {
      this.documentList.reload();
  }
}
  showPreview(event) {
    const entry = event.value.entry;
    if (entry && entry.isFile) {
      this.preview.showResource(entry.id);
    }
  }
  getFileFiltering(): string {
    return this.acceptedFilesTypeShow ? this.acceptedFilesType : '*';
}
getCurrentDocumentListNode(): MinimalNodeEntity[] {
  if (this.documentList.folderNode) {
      return [{ entry: this.documentList.folderNode }];
  } else {
      return [];
  }
}
  toggleGalleryView(): void {
    this.displayMode = this.displayMode === DisplayMode.List ? DisplayMode.Gallery : DisplayMode.List;
    const url = this
        .router
        .createUrlTree(['/fond-documentaire', this.currentFolderID, 'display', this.displayMode])
        .toString();

    this.location.go(url);
}
canCreateContent(parentNode: MinimalNodeEntryEntity): boolean {
  if (parentNode) {
      return this.contentService.hasAllowableOperations(parentNode, 'create');
  }
  return false;
}
openSnackMessageError(error: any) {
  this.notificationService.showError(error.value || error);
}


hasOneFileSelected(): boolean {
  const selection = this.documentList.selection;
  return selection && selection.length === 1 && selection[0].entry.isFile;
}
canEditFolder(selection: Array<MinimalNodeEntity>): boolean {
  if (selection && selection.length === 1) {
      const entry = selection[0].entry;

      if (entry && entry.isFolder) {
          return this.contentService.hasAllowableOperations(entry, 'update');
      }
  }
  return false;
}
hasSelection(selection: Array<any>): boolean {
  return selection && selection.length > 0;
}
onDeleteActionSuccess(message: string) {
  this.uploadService.fileDeleted.next(message);
  this.deleteElementSuccess.emit();
  this.documentList.reload();
  this.openSnackMessageInfo(message);
}
openSnackMessageInfo(message: string) {
  this.notificationService.showInfo(message);
}
onNavigationError(error: any) {
  if (error) {
      this.router.navigate(['/error', error.status]);
  }
}
onFilterSelected(activeFilters: FilterSearch[]) {
  if (activeFilters.length) {
     this.navigateToFilter(activeFilters);
  } else {
     this.clearFilterNavigation();
  }
}
clearFilterNavigation() {
  this.documentList.node = null;
  if (this.currentFolderID === '-my-') {
      this.router.navigate([this.navigationRoute, '']);
  } else {
      this.router.navigate([this.navigationRoute, this.currentFolderID, 'display', this.displayMode]);
  }
  this.documentList.reload();
}
navigateToFilter(activeFilters: FilterSearch[]) {
  const objectFromMap = {};
  activeFilters.forEach((filter: FilterSearch) => {
      let paramValue = null;
      if (filter.value && filter.value.from && filter.value.to) {
          paramValue = `${filter.value.from}||${filter.value.to}`;
      } else {
          paramValue = filter.value;
      }
      objectFromMap[filter.key] = paramValue;
  });

  this.router.navigate([], { relativeTo: this.route, queryParams: objectFromMap });
}
emitReadyEvent(event: NodePaging) {
  this.documentListReady.emit(event);
}

resetError() {
  this.errorMessage = null;
}
handlePermissionError(event: any) {
  this.notificationService.showError('PERMISSION.LACKOF', null, {
      permission: event.permission,
      action: event.action,
      type: event.type
  });
}
onManageMetadata(event: any) {
  const contentEntry = event.value.entry;
  const displayEmptyMetadata = this.displayEmptyMetadata;

  if (this.contentService.hasAllowableOperations(contentEntry, 'update')) {
      this.dialog.open(MetadataDialogAdapterComponent, {
          data: {
              contentEntry,
              displayEmptyMetadata
          },
          panelClass: 'adf-metadata-manager-dialog',
          width: '630px'
      });
  } else {
      this.openSnackMessageError('OPERATION.ERROR.PERMISSION');
  }
}
onManageVersions(event: any) {
  const contentEntry = event.value.entry;
  const showComments = this.showVersionComments;
  const allowDownload = this.allowVersionDownload;

  if (this.contentService.hasAllowableOperations(contentEntry, 'update')) {
      this.dialog.open(VersionManagerDialogAdapterComponent, {
          data: { contentEntry, showComments, allowDownload },
          panelClass: 'adf-version-manager-dialog',
          width: '630px'
      });
  } else {
      this.openSnackMessageError('OPERATION.ERROR.PERMISSION');
  }
}

onUploadNewVersion(ev) {
  const contentEntry = ev.detail.data.node.entry;
  const showComments = this.showVersionComments;
  const allowDownload = this.allowVersionDownload;
  const newFileVersion = ev.detail.files[0].file;

  if (this.contentService.hasAllowableOperations(contentEntry, 'update')) {
      this.dialog.open(VersionManagerDialogAdapterComponent, {
          data: {
              contentEntry,
              showComments,
              allowDownload,
              newFileVersion,
              showComparison: true
          },
          panelClass: 'adf-version-manager-dialog',
          width: '630px'
      });
  } else {
      this.openSnackMessageError('OPERATION.ERROR.PERMISSION');
  }
}
userHasPermissionToManageVersions(): boolean {
  const selection = this.documentList.selection;
  return this.contentService.hasAllowableOperations(selection[0].entry, 'update');
}
isCustomActionDisabled(node: MinimalNodeEntity): boolean {
  return !(node && node.entry && node.entry.name === 'custom');
}
runCustomAction(event: any) {
  this.logService.log(event);
}
canDownloadNode(node: MinimalNodeEntity): boolean {
  return node && node.entry && node.entry.name === 'custom';
}
onContentActionError(errors: any) {
  const errorStatusCode = JSON.parse(errors.message).error.statusCode;
  let message: string;

  switch (errorStatusCode) {
      case 403:
          message = 'OPERATION.ERROR.PERMISSION';
          break;
      case 409:
          message = 'OPERATION.ERROR.CONFLICT';
          break;
      default:
          message = 'OPERATION.ERROR.UNKNOWN';
  }

  this.openSnackMessageError(message);
}
onContentActionSuccess(message: string) {
  this.openSnackMessageInfo(message);
  this.documentList.reload();
}
onPermissionRequested(node: any) {
 this.dialog.open(PermissionsComponent, {
    data: node.value.entry.id
  });
 // this.router.navigate(['/permissions', node.value.entry.id]);
}
onAspectUpdate(event: any) {
  this.aspectListService.openAspectListDialog(event.value.entry.id).subscribe((aspectList) => {
      this.nodeService.updateNode(event.value.entry.id, {aspectNames : [...aspectList]}).subscribe(() => {
          this.openSnackMessageInfo('Node Aspects Updated');
      });
  });
}
toggleThumbnails() {
  this.thumbnails = !this.thumbnails;
  this.documentList.reload();
}

getNodeNameTooltip(row: DataRow): string {
  if (row) {
      return row.getValue('name');
  }
  return null;
}
onMultipleFilesUpload() {
  this.selectedNodes = [];
}
toggleAllowDropFiles() {
  this.allowDropFiles = !this.allowDropFiles;
  this.documentList.reload();
}
onInfiniteScrolling(): void {
  this.infiniteScrolling = !this.infiniteScrolling;
  this.infinitePaginationComponent.reset();
}
onComment(node: any){
  this.dialog.open(CommentsComponent, {
    data: node.value.entry.id
  });


}


}

