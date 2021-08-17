import { Component, OnInit } from '@angular/core';
import { GenericListComponent, GenericListDataSource } from '../generic-list/generic-list.component';
import { RelatedItemsService } from '../../services/related-items.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'addon-collections',
  templateUrl: './collections-list.component.html',
  styleUrls: ['./collections-list.component.scss']
})
export class CollectionsListComponent implements OnInit {

  constructor(
      public translate: TranslateService,
      public router: Router,
      public route: ActivatedRoute,
      public relatedItemsService: RelatedItemsService
      ) { }

  ngOnInit() {
  }

  listDataSource: GenericListDataSource = {
    getList: async (state) => {
        if (state.searchString != "") {

            return this.relatedItemsService.get();
        }
        return this.relatedItemsService.get();
    },

    getDataView: async () => {
        return {
            Context: {
                Name: '',
                Profile: { InternalID: 0 },
                ScreenSize: 'Landscape'
              },
              Type: 'Grid',
              Title: 'Todos',
              Fields: [
                {
                    FieldID: 'Name',
                    Type: 'TextBox',
                    Title: this.translate.instant('Name'),
                    Mandatory: false,
                    ReadOnly: true
                },
                {
                    FieldID: 'Description',
                    Type: 'TextBox',
                    Title: this.translate.instant('Description'),
                    Mandatory: false,
                    ReadOnly: true
                },
                {
                    FieldID: 'DueDate',
                    Type: 'DateAndTime',
                    Title: this.translate.instant('Due date'),
                    Mandatory: false,
                    ReadOnly: true
                },
                {
                    FieldID: 'Completed',
                    Type: 'Boolean',
                    Title: this.translate.instant('completed'),
                    Mandatory: false,
                    ReadOnly: true
                }
              ],
              Columns: [
                {
                  Width: 25
                },
                {
                  Width: 25
                },                     {
                  Width: 25
                },
                {
                  Width: 25
                }
              ],
              
              FrozenColumnsCount: 0,
              MinimumColumnWidth: 0
        }
    },

    getActions: async (objs) =>  {
        const actions = [];

        return actions;
    },

    getAddHandler: async () => {
        return this.router.navigate(["./addItem"], {
            relativeTo: this.route,
            queryParamsHandling: 'merge'
        });
    }
}

}
