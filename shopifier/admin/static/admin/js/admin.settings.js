import { Component, DynamicComponentLoader, ViewContainerRef } from 'angular2/core';
import { Router, RouteParams, RouteConfig, ROUTER_DIRECTIVES,  } from 'angular2/router'
import { FORM_PROVIDERS, FORM_DIRECTIVES, FormBuilder, Validators } from 'angular2/common';
import 'rxjs/Rx'

import { AdminAuthService } from './admin.auth'


//------------------------------------------------------------------------------
@Component({
    selector      : 'profile',
    templateUrl: 'templates/account/profile.html',
    directives    : [FORM_DIRECTIVES],
    providers: [ UploadService ]
})
export class AdminAccountProfile{
    errors = [];
    obj_errors = {};
    user = null;
    sessions = [];
    new_avatar = null;
    
    formChange = false;
    emailChange = false;
    passwordChange = false;
    confirmPassword = false;
    expireSessions = false;
    showSetAdmin = false;

    static get parameters() {
        return [[AdminAuthService], [FormBuilder], [RouteParams] ];
    }
    constructor(authService, formbuilder, routeparams ) {
        this._routeParams = routeparams;
        this._authService = authService;
        
        
        this.lform = formbuilder.group({
            'first_name': ['', Validators.required],
            'last_name': ['', Validators.required],
            'phone': [''],
            'www_site': [''],
            'bio': [''],
            'avatar_image': [''],
            'email': [''],
            'is_admin': [''],
            'admin_password': [''],
            'password1': [''],
            'password2': [''],
        }); 
    
    }
    
    ngOnInit() {
        let id = this._routeParams.get('id');
        this._authService
            .get(`/api/admin/${id}/`)
            .subscribe( data => { this.onInit(data); },
                        err => {
                                    this.obj_errors = err; 
                                    this.errors = this._authService.to_array(err.json()); 
                                }, 
                       ); 
        this.getSessions(id);
    }
    
    
    onInit(data) {
        this.user = data;
        this.new_avatar = null;
        this.formChange = false;
        this.emailChange = false;
        this.passwordChange = false;
        this.confirmPassword = false;
        this.expireSessions = false;
        this.showSetAdmin = false;
         
        this._authService.admin.test(4, 2, 
            {
                'url':'#', 'text': `${this.user.first_name} ${this.user.last_name}`
            });   
        
        this._authService.admin.headerButtons = [];
        if (!this.user.is_admin) {
            this._authService.admin.headerButtons.push(
                {
                    'text': 'Make this user the account owner', 
                    'class': 'btn mr10', 'click': this.setAdmin, 'self': this 
                });
        }
        
        this._authService.admin.headerButtons.push(
            {
                'text': 'Save', 'class': 'btn btn-blue', 
                'click': this.onSave, 'self': this 
            });
        
        for (let control in this.lform.controls) {
            if (control != 'avatar_image') {
                this.lform.controls[control].updateValue(undefined);
                this.lform.controls[control].updateValue(this.user[control], true, true);
            }
        }
        
    }
    
    cls() {
        this.confirmPassword = false;
        for (let control in this.lform.controls) {
            if (control != 'avatar_image') {
                this.lform.controls[control].updateValue(undefined);
                this.lform.controls[control].updateValue(this.user[control], true, true);
            }
        }
    }
    
    onSave(self) {
        if (!self) 
            self = this;
               
        if  (
                self.lform.controls['email'].value != self.user.email || 
                self.lform.controls['password1'].value  || 
                self.lform.controls['password2'].value 
            ) { 
            
            self.lform.controls['admin_password'].updateValue('');
            self.confirmPassword = true;
        }        
        else 
            self.onSaveAdmin();
    }
    
    onSaveAdmin() { // admin permissions
     
        if (this.new_avatar)
            this.lform.controls['avatar_image'].updateValue(this.new_avatar);   
        
        this._authService
            .put(this.lform.value, `/api/admin/${this.user.id}/`)
            .subscribe( data => this.onInit(data),
                        err => { 
                                this.obj_errors = err.json(); 
                                this.errors = this._authService.to_array(err.json()); 
                                this.cls();
                        }, 
            );  
    }
    
        
    setAdmin(self) {    
        self.showSetAdmin = true;
    }
    
    addOwnership() {
        this._authService
            .post({}, `/api/admin/${this.user.id}/setadmin/`)
            .subscribe( () => this.ngOnInit());  
    }
    
    upLoadAvatar(event) {
        let files = event.target.files;
        if (files && files[0]) {
            let reader = new FileReader();
            let self = this;            
            
            reader.onload = (event) => {
                self.new_avatar =  event.target.result;
                self.formChange = true;
            };
            reader.readAsDataURL(files[0]);
        }
    }
    
    deleteAvatar() {
        if (this.user.avatar)
            this.formChange = true;
        
        this.new_avatar = null;
        this.user.avatar = null;
        this.lform.controls['avatar_image'].updateValue(null);
    }
    
    getSessions(id) {
        this._authService
            .get(`/api/admin/${id}/session/`)
            .subscribe( data => this.sessions = data);        
    }
    
    deleteSessions() {
        this._authService
            .delete(`/api/admin/${this.user.id}/deletesession/`)
            .subscribe( () => this.getSessions(this.user.id) );   
    }
    
    setDate (date) {
        let d = new Date(date);
        return d;
    }
    
}


//------------------------------------------------------------------------------
@Component({
    selector      : 'sessions',
    templateUrl: 'templates/account/del-sessions.html',
    directives    : [FORM_DIRECTIVES],
})
export class AdminAccountDeleteSessions {
    show = false;
    parrent = null;
    errors = [];
    obj_errors = {};
    
    static get parameters() {
        return [[AdminAuthService]];
    }
    constructor(authService) {
        this._authService = authService;
    }
    
    goDeleteSessions() {
        this._authService.delete('/api/sessions-expire/')
                .subscribe( () => {},
                            () => {}, 
                            () =>  {this.show=false;} 
                 );
    }   
}


//------------------------------------------------------------------------------
@Component({
    selector      : 'delete',
    templateUrl: 'templates/account/delete.html',
    directives    : [FORM_DIRECTIVES],
})
export class AdminAccountDelete {
    show = false;
    parrent = null;
    user = {};
    errors = [];
    obj_errors = {};
    
    static get parameters() {
        return [[AdminAuthService]];
    }
    constructor(authService) {
        this._authService = authService;
    }
    
    goDelete() {
        this._authService.delete(`/api/admin/${this.user.id}/`)
                .subscribe( () => { this.show=false;},
                            () => {}, 
                            () => this.parrent.userRefresh() 
                 );                                
    }   
}


//------------------------------------------------------------------------------
@Component({
    selector      : 'invite',
    templateUrl: 'templates/account/invaite.html',
    directives    : [FORM_DIRECTIVES],
})
export class AdminAccountInvite {
    show = false;
    parrent = null;
    errors = [];
    obj_errors = {};
    first_nameErr = true;
    boolInvite = false;
    
    static get parameters() {
        return [[AdminAuthService], [FormBuilder]];
    }
    constructor(authService, formbuilder) {
        
        this._authService = authService;
        this.lform = formbuilder.group({
                    'email':    ['', this._authService.emailValidator],
                    'first_name': ['', Validators.required],
                    'last_name': ['', Validators.required],
                }); 
    }
    
    goInvite () {
        /*
        if(this.lform.controls['email'].status == 'INVALID' ||
            this.lform.controls['first_name'].status == 'INVALID' ||
            this.lform.controls['last_name'].status == 'INVALID') {
            //novalid
            return;
        }
        */
        this._authService.post(this.lform.value, '/api/user-invite/')
                .subscribe( data => { this.show=false;},
                            err => { this.obj_errors = err.json(); this.to_array(err.json()); }, 
                            () => this.parrent.userRefresh() 
                 );                                
    }
    
    to_array (err) {
        if (Object.prototype.toString.call(err) === '[object Array]') 
            this.errors = err;
        else {    
            this.errors = [];
            for (let i in err) {
                this.errors.push(i + ':' + err[i]);
            }
        }
    }
    
    cls () {
        for (let control in this.lform.controls) {
            this.lform.controls[control].updateValue('', true, true);
        }
        this.obj_errors = {};
        this.errors = [];
    }
}


//------------------------------------------------------------------------------
@Component({
    selector      : 'main',
    templateUrl: 'templates/account/account.html',
    directives    : [FORM_DIRECTIVES],
})
export class AdminAccount {
    currentUser = null;
    users = [];    

//modal
    invite_user = null;
    delete_user = null;
    delete_sessions = null;
        
    static get parameters() {
        return [[AdminAuthService], [FormBuilder], [Router], [DynamicComponentLoader], [ViewContainerRef]];
    }
     
    constructor(authService, formbuilder, router, dcl, viewContainerRef) {
        this._router = router;
        this.dcl = dcl;
        this.viewContainerRef = viewContainerRef;
        this._authService = authService;
        
    }
    
    ngOnInit() {
        
        this._authService.get('/api/admin/')
            .subscribe( data => this.users = data ); 
        
        this._authService.get('/api/current-user/')
            .subscribe( data => { this.currentUser = data; } );      
              
        this.dcl.loadNextToLocation(AdminAccountInvite,  this.viewContainerRef)
            .then((compRef)=> {
                this.invite_user = compRef.instance;
                this.invite_user.parrent = this; 
            });      
        
        this.dcl.loadNextToLocation(AdminAccountDelete,  this.viewContainerRef)
            .then((compRef)=> {
                this.delete_user = compRef.instance;
                this.delete_user.parrent = this; 
            });
        
        this.dcl.loadNextToLocation(AdminAccountDeleteSessions,  this.viewContainerRef)
            .then((compRef)=> {
                this.delete_sessions = compRef.instance;
                this.delete_sessions.parrent = this; 
            });    
    }
        
    setDate (date) {
        let d = new Date(date);
        return d;
    }
    
    goInvite() {
        this.invite_user.show = true;
        this.invite_user.cls();
    }
    
    goDelete(user) {
        this.delete_user.show = true;
        this.delete_user.user = user;
    }
    
    goDeleteSessions() {
        this.delete_sessions.show = true;
    }
    
    goProfile(user) {
        let link = ['Profile', {'id': user.id }];
        this._router.navigate(link);
    }
    
    userRefresh() {
       this._authService.get('/api/admin/')
            .subscribe( data => this.users = data );  
    }
}


//------------------------------------------------------------------------------ 
@Component({
  selector: 'main',
  template : '<router-outlet></router-outlet>',
  directives: [ROUTER_DIRECTIVES],
})
@RouteConfig([

    {
        path : '/account/:id',
        name : 'Profile',
        component : AdminAccountProfile,
    },
    {
        path : '/account',
        name : 'Account',
        component : AdminAccount,
    },
])
export class AdminSettings {
}
