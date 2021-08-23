import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'addon-related_item_info',
  templateUrl: './related_item_info.component.html',
  styleUrls: ['./related_item_info.component.scss']
})
export class Related_item_infoComponent implements OnInit {

  constructor(public router: Router,
              public activatedRoute: ActivatedRoute) { }

  ngOnInit() {
  }

  goBack() {
    this.router.navigate(['..'], {
      relativeTo: this.activatedRoute,
      queryParamsHandling: 'preserve'
    })
  }

  backClicked() {
    this.goBack();
  }

}
