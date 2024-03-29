import { Component, ElementRef, Injectable, ViewChild } from '@angular/core';
import { MyModel } from './model/myModel';

// import data from 'src/assets/data/company.json';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { MockServerResultsServiceService } from './mock-server-results-service.service';
import {  faSearch, faSyncAlt, faTimesCircle } from '@fortawesome/free-solid-svg-icons';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  faSearch = faSearch;
  faRefresh = faSyncAlt;
  faTimesCircle = faTimesCircle;

  readonly headerHeight = 50;
  readonly rowHeight = 50;
  readonly pageLimit = 10;

  myColumns=[ 
    { name: 'Nom du chirurgien'       ,prop: 'surgeon'      ,canAutoResize:true},
    { name: 'Spécialité'              ,prop: 'specialty'    ,canAutoResize:true},
    { name: 'Nombre d’interventions'  ,prop: 'interventions',canAutoResize:true },
    { name: 'Anesthésiste favori '    ,prop: 'anesthesiste' ,canAutoResize:true}, 
    { name: 'Infirmière favorite'     ,prop: 'nurse'        ,canAutoResize:true}, 
    { name: 'Salle la plus fréquente' ,prop: 'roomNumber'   ,canAutoResize:true},
    { name: 'Acte le plus fréquent'   ,prop: 'intervention' ,canAutoResize:true}
  ];

  rows: MyModel[]= [];
  temp: MyModel[]= [];
  isLoading: boolean;
  isSearch: boolean;

  ColumnMode = ColumnMode;
  @ViewChild(DatatableComponent) table: DatatableComponent;
  
  constructor(private serverResultsService: MockServerResultsServiceService, private el: ElementRef) {}

  ngOnInit() {
    this.Initialize();
  }

  Initialize(){
    this.rows = [];
    this.temp = [];
    (<HTMLInputElement>document.getElementById("search")).value ="";
    this.isSearch = false;
    this.onScroll(0);
  }

  //Search Functions
  updateFilter(event) {



    //Get search Value
    const val = event.target.value.toLowerCase();
    if(val.length > 0){
      this.isSearch = true;
      // update the rows
      this.isLoading=true;
      this.rows = [];
      // filter our data
      // const temp = this.temp.filter(function (d) {
      //   return d.name.toLowerCase().indexOf(val) !== -1 || !val;
      // });
      this.serverResultsService.getSurgeont(val).subscribe( (result:MyModel[])=>{
        
        this.isLoading=false;

        // Whenever the filter changes, always go back to the first page
        this.table.offset = 0;

        //Update Data
        this.rows=result;
      });
    }else{      
      this.Initialize();
    }
  }
  //END

  //Scroll and pagination funstions
  onScroll(offsetY: number) {
    // total height of all rows in the viewport
    const viewHeight = this.el.nativeElement.getBoundingClientRect().height - this.headerHeight;

    // check if we scrolled to the end of the viewport
    if (!this.isLoading && offsetY + viewHeight >= this.rows.length * this.rowHeight) {
      // total number of results to load
      let limit = this.pageLimit;

      // check if we haven't fetched any results yet
      if (this.rows.length === 0) {
        // calculate the number of rows that fit within viewport
        const pageSize = Math.ceil(viewHeight / this.rowHeight);

        // change the limit to pageSize such that we fill the first page entirely
        // (otherwise, we won't be able to scroll past it)
        limit = Math.max(pageSize, this.pageLimit);
      }
      this.loadPage(limit);
    }
  }

  private loadPage(limit: number) {
    // set the loading flag, which serves two purposes:
    // 1) it prevents the same page from being loaded twice
    // 2) it enables display of the loading indicator
    this.isLoading = true;

    this.serverResultsService.getResults(this.rows.length, limit).subscribe((results:MyModel[]) => {
      console.log("Results",results);
      
      const rows = [...this.rows, ...results];
      this.rows = rows;
      this.isLoading = false;
    });
  }

}
