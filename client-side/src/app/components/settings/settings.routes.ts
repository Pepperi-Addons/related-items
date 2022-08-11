import { NgModule } from '@angular/core';
import { Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SettingsComponent } from './settings.component';
import { CollectionsListComponent } from '../collections/collections-list.component';
import { RelatedCollectionsComponent } from '../collections-relations/collections-relations.component';
import { RelatedCollectionFormComponent } from '../related-collection-form/related-collection-form.component';

// Important for single spa
@Component({
    selector: 'app-empty-route',
    template: '<div>Route is not exist.</div>',
})
export class EmptyRouteComponent {}

const routes: Routes = [
    {
        path: ':settingsSectionName/:addonUUID/:slugName',
        component: SettingsComponent,
        children: [
            {
                path: '',
                component: CollectionsListComponent
            },
            {
                path: ':collection_name',
                component: RelatedCollectionsComponent
            },
            {
                path: ':collection_name/:external_id',
                component: RelatedCollectionFormComponent
            },
            { path: '**', component: EmptyRouteComponent }
        ]
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes),
    ],
    exports: [RouterModule]
})
export class SettingsRoutingModule { }
