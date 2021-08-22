import { Component, OnInit, ViewChild } from '@angular/core';
import { GenericListComponent, GenericListDataSource } from '../generic-list/generic-list.component';
import { RelatedItemsService } from '../../services/related-items.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PepCustomizationService, PepLoaderService, PepStyleType } from '@pepperi-addons/ngx-lib';

@Component({
  selector: 'addon-collections',
  templateUrl: './collections-list.component.html',
  styleUrls: ['./collections-list.component.scss']
})
export class CollectionsListComponent implements OnInit {
  @ViewChild(GenericListComponent) genericList: GenericListComponent;

  showLoading = false;

  constructor(
    public translate: TranslateService,
    public router: Router,
    public route: ActivatedRoute,
    public loaderService: PepLoaderService,
    public relatedItemsService: RelatedItemsService
  ) {

    this.loaderService.onChanged$
    .subscribe((show) => {
        this.showLoading = show;
    });
  }

  ngOnInit() { }

  listDataSource: GenericListDataSource = {
    getList: async (state) => {
      let res = this.relatedItemsService.getCollections();
      return res;
    },

    getDataView: async () => {
      return {
        Context: {
          Name: '',
          Profile: { InternalID: 0 },
          ScreenSize: 'Landscape'
        },
        Type: 'Grid',
        Title: 'Related Items',
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
            FieldID: 'Count',
            Type: 'NumberInteger',
            Title: this.translate.instant('Count'),
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
          }, {
            Width: 25
          }
        ],

        FrozenColumnsCount: 0,
        MinimumColumnWidth: 0
      }
    },

    getActions: async (objs) => {
      const actions = [];

      if (objs.length === 1) {
        actions.push({
          title: this.translate.instant("Edit"),
          handler: async (objs) => {
            this.router.navigate([objs[0].Name], {
              relativeTo: this.route,
              queryParamsHandling: 'merge'
            });
          }
        });
      }

      return actions;
    },

    getAddHandler: async () => {
      return this.router.navigate(["./addCollection"], {
        relativeTo: this.route,
        queryParamsHandling: 'merge'
      });
    }
  }

}
