import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Card } from '../Entities/Models/card.model';
import { DataStorageService } from '../services/data-storage.service';
import { HelperService } from '../services/helper.service';
import { HttpService } from '../services/http.service';


@Component({
  selector: 'app-cards-page',
  templateUrl: './cards-page.component.html'
})
export class CardsPageComponent implements OnInit {
  constructor(
    private httpService: HttpService,
    private dataStorageService: DataStorageService,
    private formBuilder: FormBuilder,
    private helperService: HelperService
  ) { }


  cards: Card[] = [];
  filteredCards: Card[] = [];
  showFilteredCards = false;

  isLoading = false;
  errMessage = null;
  name: string;

  dropdownForm: FormGroup;
  filterByColors = ['white', 'blue', 'black', 'red', 'green'];
  filterByTypes = [];

  showCheckbox = '';

  ngOnInit() {
    this.initializeCards();
    this.initializeDropdownForm();
    this.name = this.dataStorageService.name;
  }

  onSubmit(): void {
    this.filteredCards.length = 0;
    this.handleFilters();
  }

  initializeCards(): void {
    this.isLoading = true;

    this.httpService.getCards()
      .subscribe((res: any) => {
        const cards = res.cards;
        this.cards = cards;

        this.cards.sort(this.helperService.sortDescendingByName);
        console.log(this.cards);

        this.isLoading = false;
      },
        (errRes: HttpErrorResponse) => {
          console.log(errRes);
          this.errMessage = errRes.error;

          this.isLoading = false;
        });

    this.httpService.getTypes()
      .subscribe((res: any) => {
        const types = res.types;
        this.filterByTypes = types;
      });
  }

  initializeDropdownForm(): void {
    this.dropdownForm = this.formBuilder.group({
      colors: this.formBuilder.array([]),
      types: this.formBuilder.array([]),
      name: [null]
    })
  }

  handleFilters(): void {
    let noSuchCardFound;

    const colors: string[] = this.dropdownForm.get('colors').value;
    if (colors && colors.length > 0) {
      console.log(colors);
      this.applyFilterBy('colors', colors);
  
      noSuchCardFound = (this.filteredCards.length == 0);
      if (noSuchCardFound) {
        return;
      }
    }

    const types: string[] = this.dropdownForm.get('types').value;
    if (types && types.length > 0) {
      this.applyFilterBy('types', types);
     
      noSuchCardFound = (this.filteredCards.length == 0);
      if (noSuchCardFound) {
        return;
      }
    }

    const sortByName = this.dropdownForm.get('name').value;
    if (sortByName) {
      this.sortItems(sortByName[0]);
    }
  }

  applyFilterBy(property: string, searchItems: string[]): void {
    if (this.filteredCards.length === 0) {
      this.filteredCards = this.helperService.filterItems(this.cards, property, searchItems);
    }
    else {
      this.filteredCards = this.helperService.filterItems(this.filteredCards, property, searchItems);
    }

    this.showFilteredCards = true;
  }

  sortItems(sortWay: string): void {
    const noFiltersApplied = this.filteredCards.length === 0;
    if (sortWay == 'ascending' && noFiltersApplied) {
      this.filteredCards = [...this.cards]
        .sort(this.helperService.sortAscendingByName)
    }
    else if (sortWay == 'descending' && noFiltersApplied) {
      this.filteredCards = [...this.cards]
        .sort(this.helperService.sortDescendingByName);
    }
    else if (sortWay == 'ascending') {
      this.filteredCards = [...this.filteredCards]
        .sort(this.helperService.sortAscendingByName)
    }
    else {
      this.filteredCards = [...this.filteredCards]
        .sort(this.helperService.sortDescendingByName);
    }

    this.showFilteredCards = true;
  }

  onSearch(searchEl: any): void {
    const searchTerm: string = searchEl.value;

    this.filteredCards = this.cards
      .filter(card => this.helperService.filterByNameOrText(card, searchTerm));

    this.showFilteredCards = true;
    searchEl.value = '';
  }

  onCheckboxChange(event, control): void {
    const eTarget = event.target;
    const formArray: FormArray = this.dropdownForm.get(control) as FormArray;
    
    if (eTarget.checked && eTarget.value) {
      formArray.push(new FormControl(eTarget.value)); 
    } else {
       const index = formArray.controls
        .findIndex(control => control.value === eTarget.value);
       formArray.removeAt(index);
    }
  }

  onSelect(checkbox): void {
    if (this.showCheckbox === checkbox) {
      this.showCheckbox = '';
      this.dropdownForm['colors'] = this.formBuilder.array([]);
      this.dropdownForm['types'] = this.formBuilder.array([]);
      this.dropdownForm['name'] = null;

      return;
    }

    this.showCheckbox = checkbox;
  }

  onReset(): void {
    this.showFilteredCards = false;
  }
}
