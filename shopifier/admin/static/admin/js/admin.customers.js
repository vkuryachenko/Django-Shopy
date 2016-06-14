import { Component, DynamicComponentLoader, 
        ViewContainerRef, Pipe } from 'angular2/core';
import { Router, RouteParams, RouteConfig, ROUTER_DIRECTIVES,  } from 'angular2/router'
import { FORM_PROVIDERS, FORM_DIRECTIVES, FormBuilder, 
        Validators, Control, ControlGroup } from 'angular2/common';
import { Http } from 'angular2/http'
import 'rxjs/Rx'

import { AdminAuthService, AdminUtils } from './admin.auth'
import { Autosize, Popover } from './components'
import { Admin } from './admin'

@Pipe({
    name: 'province'
})
export class ProvincePipe{
    transform(regions, country) {
    return regions.filter( region => {
        return region.value.substr(0, 2) === country;
    });
  }
}

//------------------------------------------------------------------------------ 
export class BaseForm {
    errors = [];
    obj_errors = {};
    api_data = {}

    form = {};    //tree controls

    formChange = false;
    
    constructor(http, formbuilder, router, auth, admin, utils) {
        this._http = http;
        this._router = router;
        this._admin = admin;
        this._auth = auth;
        this._utils = utils;
        this._formbuilder = formbuilder;
    }
    
    addForm(form, url, alias) {
        this._http
            .options(url)
            .subscribe(data =>  {
                                    this.addFormFromOptinons(form, data, alias)
                                },
                        err => {
                                    this.obj_errors = err; 
                                    this.errors = this._utils.to_array(err.json()); 
                                }, 
                       );
    }
    
    addFormFromOptinons(form, data, alias) {
        let group = data.actions[Object.keys(data.actions)[0]];
        this.addGroup(form, group, alias);
    }
    
    addGroup(form, group, group_name) {
        if (Object.prototype.toString.call(group) !== '[object Object]')
            return;
        form[group_name] = this._formbuilder.group({});
        form[group_name + '_meta'] = {};
        
        let keys = Object.keys(group);
        
        for (let i in keys) {
            let ctrl = keys[i];
            if ('children' in group[ctrl]) 
                this.addGroup(form, group[ctrl].children, ctrl);
            else
                this.addControl(form, group, group_name, ctrl);
        }
    }
    
    addControl(form, group, group_name, ctrl_name){
        if (group[ctrl_name].read_only) 
            return;
            
        let validators = [];
        if (group[ctrl_name].required)
            validators.push(Validators.required);
            
        if (group[ctrl_name].type==='email')
            validators.push(this.emailValidator);

        if (group[ctrl_name].max_length)
            validators.push(Validators.maxLength(group[ctrl_name].max_length));
        
        if (group[ctrl_name].min_length)
            validators.push(Validators.minLength(group[ctrl_name].min_length));
        
        form[group_name + '_meta'][ctrl_name] = {'label': group[ctrl_name].label};

        let control = new Control('', Validators.compose(validators));
        
        if (group[ctrl_name].type==='choice'){
            form[group_name + '_meta'][ctrl_name].choices = group[ctrl_name].choices;
            control.updateValue(group[ctrl_name].choices[0].value);
        }
        if (group[ctrl_name].type==='boolean') control.updateValue(false);
        if (group[ctrl_name].type==='datetime') control.updateValue(undefined);

        form[group_name].addControl(ctrl_name, control);
    }
    
    emailValidator(control) {
        if (control.value.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)) {
            return null;
        }   else {
            return {'Invalid Email Address': true };
        }
    }
    
    groupValidate (form, group_name) {
        //form[group_name].updateValueAndValidity();
        let keys = Object.keys(form[group_name].controls);
        this.obj_errors = {};
        this.errors = [];
        for (let i in keys) {
            let ctrl = keys[i];
            if (!form[group_name].controls[ctrl].valid) {
                this.obj_errors[ctrl] = true;
                let err1 = form[group_name + '_meta'][ctrl].label;
                let err2 = Object.keys(form[group_name].controls[ctrl].errors)[0];
                this.errors.push(`${err1}: ${err2}`); 
                form[group_name + '_meta'][ctrl].error = true;
            }
            else
                form[group_name + '_meta'][ctrl].error = false;
        }
//        console.log(form[group_name]);
        return form[group_name].valid
    }
    
    clsErrors(form, group_name) {
        this.obj_errors = {};
        this.errors = [];
        let keys = Object.keys(form[group_name + '_meta']);
        for (let i in keys) {
            let ctrl = keys[i];
            form[group_name + '_meta'][ctrl].error = false;
        }
    }

    apiErrors(form, group_name, errors) {
        let keys = Object.keys(errors);
        this.obj_errors = {};
        this.errors = [];
        
        for (let i in keys) {
            let ctrl = keys[i];
            for (let j in errors[ctrl]) {
                this.obj_errors[ctrl] = true;
                let err1 = form[group_name + '_meta'][ctrl].label;
                let err2 = errors[ctrl][j];
                this.errors.push(`${err1}: ${err2}`); 
                form[group_name + '_meta'][ctrl].error = true;
            }
        }
    } 

    getAPIData(action, url){
        this._http
            .get(url)
            .subscribe( data => this.onInit(data), 
                        err => {
                                    this.obj_errors = err; 
                                    this.errors = this._utils.to_array(err.json()); 
                                }, 
                       ); 
    }
    setDataToControls(group, obj) {
        let keys = Object.keys(group.controls);
        for (let i in keys) {
            let ctrl = keys[i];
            if (obj[ctrl])
                group.controls[ctrl].updateValue(obj[ctrl]);
        }
        
    }
}


//------------------------------------------------------------------------------ 
@Component({
  selector: 'main',
  templateUrl : 'templates/customer/new.html',
  directives: [FORM_DIRECTIVES, Autosize],
  pipes: [ProvincePipe]
})
export class CustomersNew extends BaseForm{

    static get parameters() {
        return [[Http], [FormBuilder], [Router], [AdminAuthService], [Admin], [AdminUtils]];
    }
    constructor(http, formbuilder, router, auth, admin, utils) {
        super(http, formbuilder, router, auth, admin, utils);
    }
    
    ngOnInit() {
        this._admin.currentUrl({ 'url':'#', 'text': 'Add customer'});
        
        this._admin.headerButtons = [];
        this._admin.headerButtons.push(
            {
                'text': 'Cancel', 'class': 'btn mr10', 
                'click': this.onCancel, 'self': this 
            });
        this._admin.headerButtons.push(
            {
                'text': 'Save customer', 'class': 'btn btn-blue', 
                'click': this.onSave, 'primary': true, 'self': this 
            });
        this.addForm(this.form, '/admin/customers.json', 'customer');
    }
    
    onSave(self) {
        self = self || this;
        
        if(!self.groupValidate(self.form, 'customer')) return;
        
        let customer = {};
        customer['customer'] = self.form['customer'].value;
        
        self._http
            .post('/admin/customers.json', customer )
            .subscribe( data => self.saveAddress(data),
                        err => { 
                                self.apiErrors(self.form, 'customer', err.json());
                                //this.cls();
                        }, 
            );
    }
    
    saveAddress(customer) {
        let address = {};
        address['address'] = this.form['default_address'].value;
        
        this._http
            .post(`/admin/customers/${customer.customer.id}/addresses.json`, address )
            .subscribe( data => this.setDefaultAddress(customer, data),
                        err => { 
                                this.apiErrors(this.form, 'default_address', err.json())
                                //this.cls();
                        }, 
            );
    }

    setDefaultAddress(customer, address) {
        this._http
            .put(`/admin/customers/${customer.customer.id}/addresses/${address.customer_address.id}/default.json`)
            .subscribe( data => {
                        let link = ['EditCustomer', {'id': customer.customer.id }];
                        this._router.navigate(link);
                    },
                    err => { 
                            this.apiErrors(this.form, 'default_address' ,err.json())
                            //this.cls();
                    }, 
            );
    }

    onCancel(self) {
        self = self || this;
        self._router.navigate(['Customers']);
    }
}


//------------------------------------------------------------------------------ 
@Component({
  selector: 'main',
  templateUrl : 'templates/customer/edit.html',
  directives: [FORM_DIRECTIVES, Autosize, Popover],
  pipes: [ProvincePipe]
})
export class CustomersEdit extends BaseForm{
    
    showChangeAddress = false;
    
    static get parameters() {
        return [[Http], [FormBuilder], [Router], [AdminAuthService], 
                [Admin], [AdminUtils], [RouteParams]];
    }
    constructor(http, formbuilder, router, auth, admin, utils, routeparams) {
        super(http, formbuilder, router, auth, admin, utils);
        this._routeParams = routeparams;
    }
    
    ngOnInit() {
                
        this._admin.headerButtons = [];
        this._admin.headerButtons.push(
            {
                'text': '<', 'class': 'btn mr10', 
                'click': this.onPrev, 'self': this 
            });
        this._admin.headerButtons.push(
            {
                'text': '>', 'class': 'btn mr10', 
                'click': this.onNext, 'self': this 
            });
        this._admin.headerButtons.push(
            {
                'text': 'Save', 'class': 'btn btn-blue', 
                'click': this.onSaveNote, 'primary': true, 'self': this 
            });
        let id = this._routeParams.get('id');
        this.addForm(this.form, `/admin/customers/${id}.json`, 'customer');
        this.getAPIData(this.onInit, `/admin/customers/${id}.json`);
    }
    
    onInit(data) {
        this.api_data = data;
        this.setDataToControls(this.form.customer, this.api_data.customer);

        this._admin.currentUrl({
                'url':'#', 'text': `${this.api_data.customer.first_name} ${this.api_data.customer.last_name}`
                });
        
    }
    
    onSaveNote(self) {
        
    }
    
    onEditCustomer() {
        this.clsErrors(this.form, 'customer');
        
        let controls = ['first_name', 'last_name', 'email', 'accepts_marketing', 'tax_exempt']; 
        for (let i in controls) {
            let ctrl = controls[i];
            this.form.customer.controls[ctrl].updateValue(this.api_data.customer[ctrl]);
        }
        this.showEdit = true;
    }
    
    onSaveCustomer() {
        if(!this.groupValidate(this.form, 'customer')) return;
    }
    
    onChangeAddress(event) {
        event.stopPropagation();
        console.log(event);
        let popover = document.querySelector('popover');
        if (popover) {
            popover.classList.remove('hide');
            popover.classList.add('show');
        }
    }
    
    editDefaultAddewss(event){
        event.stopPropagation();
        console.log(event);
        let popover = document.querySelector('popover');
        if (popover) {
            popover.classList.add('hide');
            popover.classList.remove('show');
        }
        this.showEditDefaultAddress = true;
    }
    
    onSaveDefaultAddress(){
        
    }
}


//------------------------------------------------------------------------------ 
@Component({
  selector: 'main',
  templateUrl: 'templates/customer/customers.html',
  directives: [FORM_DIRECTIVES],
})
export class Customers {
    
    static get parameters() {
        return [[Http], [Router], [AdminAuthService], [Admin], [AdminUtils]];
    }
    constructor(http, router, auth, admin, utils ) {
        this._http = http;
        this._router = router;
        this._admin = admin;
        this._auth = auth;
        this._utils = utils;
    }
    
    ngOnInit() {
        this._admin.currentUrl();
        this._admin.headerButtons = [];
        this._admin.headerButtons.push(
            {
                'text': 'Export', 'class': 'btn mr10', 
                'click': this.onExport, 'self': this 
            });
        this._admin.headerButtons.push(
            {
                'text': 'Import customers', 'class': 'btn mr10', 
                'click': this.onImport, 'self': this 
            });
        this._admin.headerButtons.push(
            {
                'text': 'Add customer', 'class': 'btn btn-blue', 
                'click': this.onAdd, 'self': this 
            });
    }
    
    onAdd(self) {
        self._router.navigate(['NewCustomer'])
    }
}
