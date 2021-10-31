import { NgModule } from '@angular/core';
import { Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AddonComponent } from './components/addon/addon.component';
import { CollectionForm } from './components/collection-form/collection-form.component';
import { CollectionsListComponent } from './components/collections/collections-list.component';
import { RelatedCollections } from './components/collections-relations/collections-relations.component';
import { RelatedCollectionFormComponent } from './components/related-collection-form/related-collection-form.component';

// Important for single spa
@Component({
    selector: 'app-empty-route',
    template: '<div></div>',
})
export class EmptyRouteComponent { }

const routes: Routes = [
    {
        path: 'settings/:addon_uuid/collections',
        component: CollectionsListComponent
    },
    {
        path: 'settings/:addon_uuid/collections/:collection_name',
        component: RelatedCollections
    },
    {
        path: 'settings/:addon_uuid/collections/:collection_name/:external_id',
        component: RelatedCollectionFormComponent
    },
    {
        path: '**',
        component: EmptyRouteComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
    exports: [RouterModule]
})
export class AppRoutingModule { }



