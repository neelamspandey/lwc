import { LightningElement, wire,track } from 'lwc';
import getAccountList from '@salesforce/apex/TaskController.getTaskList';
import getTaskListWithFilter from '@salesforce/apex/TaskController.getTaskListWithFilter';
import { updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import description from '@salesforce/schema/Task__c.Description__c';
import Name from '@salesforce/schema/Task__c.Name';
import ID_FIELD from '@salesforce/schema/Task__c.Id';
import status from '@salesforce/schema/Task__c.Status__c';
import Due_Date from '@salesforce/schema/Task__c.Due_Date__c';
import delSelectedCons from '@salesforce/apex/TaskController.deleteTasks';
import saveTask from '@salesforce/apex/TaskController.saveTaskRecord';
// here actions is the variable used in the Class Task  within the coloumn variable
const actions = [
    { label: 'Record Details', name: 'record_details'}, 
    { label: 'Edit', name: 'edit'}, 
    { label: 'Delete', name: 'delete'}
];

export default class Task extends LightningElement {
    @track data;  // this variable will be used in the lighting data table and it consists of the All records to display
    @track error;
    @track picklistValue ='';
    @track str;  // this is the search key variable on the html page
    @track record = [];
    @track sortBy;
    @track openCreateRecord;
    @track sortDirection ='asc';
    @track draftValues = [];
    @track bShowModal = false;
    @track currentRecordId;
    @track isEditForm = false; // this boolean variable is used to close and open the edit record pop up
    @track openmodel = false;  // this boolean variable is used to close and open the view record pop up
    @track showLoadingSpinner = false;  // this boolean variable is to show and hide  the  spinner
    @track taskRecord = {
        Name : Name,
        Status__c : status,
        Due_Date__c : Due_Date,
        Description__c : description
    };
  // this coloumn variable will be used for the representing the number and properties of the fields
    @track columns = [{
        label: 'Task name',
        fieldName: 'Name',
        type: 'text',
        sortable: true ,
        editable: true,
        cellAttributes: {
            "style": {
                "fieldName": "showClass"
            }
        },
        typeAttributes: {
            "label": {
                "fieldName": "Name"
            },
            target: null,
            rowActions: { label: 'View', name: 'view'},
        },
    },
    {
        label: 'Description',
        fieldName: 'Description__c',
        type: 'picklist',
        sortable: true, editable: true,
        cellAttributes: {
            "style": {
                "fieldName": "showClass"
            }
        },
    },
    {
        label: 'Status',
        fieldName: 'Status__c',
        type: 'text',
        sortable: true, editable: true,
        cellAttributes: {
            "style": {
                "fieldName": "showClass"
            }
        },
    }, 
    {
        label: 'Due Date',
        fieldName: 'Due_Date__c',
        type: 'date',
        sortable: true, editable: true,
        cellAttributes: {
            "style": {
                "fieldName": "showClass"
            }
        },
    },
    {
        type: 'action',
        typeAttributes: {
            rowActions: actions,
            menuAlignment: 'right'
        }
    }

];
    @wire(getAccountList , {str:null})
    wiredAccounts({ error, data }) { // this function is initiallized at the time of page loading
        if (data) {
            var response = JSON.parse(data) ;  // here we are parsing the data from JSON to Array
            var today = new Date();    // here we have create a new todays date for the comaprison 
            if ( today.getMonth()+1 >9 )
            {
                var tempDate = ''+today.getFullYear()+'-'+(today.getMonth()+1)+'-'+(today.getDate()+1);
                var tommorow =  ''+today.getFullYear()+'-'+(today.getMonth()+1)+'-'+(today.getDate()+2);
            }
            else
            {
                var tempDate = ''+today.getFullYear()+'-0'+(today.getMonth()+1)+'-'+(today.getDate()+1);
                var tommorow =  ''+today.getFullYear()+'-0'+(today.getMonth()+1)+'-'+(today.getDate()+2);
            }
          //  here we are gong to compare the date and  setting the colours in the rows
            // iterate each records with forEach loop
            // this is for the UseCase 8
            console.log()
            response.forEach(function(record){ 
                if(typeof record.Id != 'undefined'){ 
                    var dueDate =  new Date(record.Due_Date__c);
                    console.log('dueDate',dueDate);
                    console.log('tommorow',tommorow);
                    console.log('tempDate',tempDate);
                    console.log('record.Due_Date__c',record.Due_Date__c);
                    // based on VIP Account field value set the icon and style class to each record mportant3
                    if(record.Status__c  != 'Completed' && ( record.Due_Date__c ==  tempDate ||  record.Due_Date__c  == tommorow  )){
                        record.showClass = (record.Status__c != 'Completed' ? 'background-color:yellow !important;' : 'color:black !important;');
                        record.displayIconName = 'utility:check';   
                    }
                    else if ( record.Status__c  != 'Completed' &&  dueDate.getTime() < today.getTime()  ) {
                        record.showClass = (record.Status__c != 'Completed' ? 'background-color:red !important;' : 'color:black !important;');
                        record.displayIconName = 'utility:close';     
                    }
                    // set the record link with record id  
                    record.linkName = '/'+record.Id;   
                }
            });
            // after the loop set the updated account records on data attribute
           this.data =response;
             console.log('response',response);
             console.log('qwerty',Object.keys(this.data) );
             console.log('qwerty1', this.accounts[Object.keys(this.data)[0]] );
        } else if (error) {
            console.log(error);
            this.error = error;
        }
    }
    handleChange(event) {
        var searchKey = event.target.value;  // on the searching the task per name this function is called 
        this.picklistValue = 'none'; 
        console.log('Current value of the input: ' + searchKey);  // searchkey that string to be sent in the Apex Controller
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.delayTimeout = setTimeout(() => {
            getAccountList({ str : searchKey })  // Apex Function is called here now
                .then(result => {
                   
                       var response = JSON.parse(result) ;
                var today = new Date();
                if ( today.getMonth()+1 >9 )
            {
                var tempDate = ''+today.getFullYear()+'-'+(today.getMonth()+1)+'-'+(today.getDate()+1);
                var tommorow =  ''+today.getFullYear()+'-'+(today.getMonth()+1)+'-'+(today.getDate()+2);
            }
            else
            {
                var tempDate = ''+today.getFullYear()+'-0'+(today.getMonth()+1)+'-'+(today.getDate()+1);
                var tommorow =  ''+today.getFullYear()+'-0'+(today.getMonth()+1)+'-'+(today.getDate()+2);
            }
               
                // iterate each records with forEach loop
                 // this is for the UseCase 8
                response.forEach(function(record){ 
                    if(typeof record.Id != 'undefined'){ 
                        var dueDate =  new Date(record.Due_Date__c);
                       
                        // based on VIP Account field value set the icon and style class to each record mportant3
                        // https://www.lightningdesignsystem.com/icons/#utility 
                        if(record.Status__c  != 'Completed' && ( record.Due_Date__c ==  tempDate ||  record.Due_Date__c  == tommorow  )){
                            record.showClass = (record.Status__c != 'Completed' ? 'background-color:yellow !important;' : 'color:black !important;');
                            record.displayIconName = 'utility:check';   
                        }
                        else if ( record.Status__c  != 'Completed' &&  dueDate.getTime() < today.getTime()  ) {
                            record.showClass = (record.Status__c != 'Completed' ? 'background-color:red !important;' : 'color:black !important;');
                            record.displayIconName = 'utility:close';     
                        }
                        // set the record link with record id  
                        record.linkName = '/'+record.Id;   
                    }
                });
                // after the loop set the updated account records on data attribute
                this.data =response;
                    this.error = undefined;
                })
                .catch(error => {
                    this.error = error;
                    this.data = undefined;
                });
        }, 100);
    }

createnew()
{
    // this funtion is used to open  new tab for creating a ne tab
    window.open("/lightning/o/Task__c/new");
  
}
// this function is used at the time of row actions are called like view edit or delete
handleRowActions(event) {
    
    console.log('rowaction');
    let actionName = event.detail.action.name;

    console.log('actionName ====> ' + actionName);

    let row = event.detail.row;
    //  here this row variable contains the particular record data on which the action is to be performed
    window.console.log('row ====> ' + row);
    // eslint-disable-next-line default-case  
    switch (actionName) {
        case 'record_details':
            this.viewCurrentRecord(row);
            break;
        case 'edit':
            this.editCurrentRecord(row);
            break;
        case 'delete':
            this.deleteCons(row);
            break;
    }
}

// this function is for deleting the record using an apex function
// this contain the UseCase5
deleteCons(currentRow) 
{
    let currentRecord = [];
    currentRecord.push(currentRow.Id);
    this.showLoadingSpinner = true;

    // calling apex class method to delete the selected contact
    delSelectedCons({lstConIds: currentRecord})
    .then(result => {
        console.log('result ====> ' + result);
        this.showLoadingSpinner = false;

        // showing success message
        this.dispatchEvent(new ShowToastEvent({
            title: 'Success!!',
            message: currentRow.FirstName + ' '+ currentRow.LastName +' Contact deleted.',
            variant: 'success'
        }),);
          
        // refreshing table data using refresh apex
        this.delayTimeout = setTimeout(() => {
            getAccountList({ str : '' })
                .then(result => {
                   
                var response = JSON.parse(result) ;
        var today = new Date();
        if ( today.getMonth()+1 >9 )
            {
                var tempDate = ''+today.getFullYear()+'-'+(today.getMonth()+1)+'-'+(today.getDate()+1);
                var tommorow =  ''+today.getFullYear()+'-'+(today.getMonth()+1)+'-'+(today.getDate()+2);
            }
            else
            {
                var tempDate = ''+today.getFullYear()+'-0'+(today.getMonth()+1)+'-'+(today.getDate()+1);
                var tommorow =  ''+today.getFullYear()+'-0'+(today.getMonth()+1)+'-'+(today.getDate()+2);
            }
        // iterate each records with forEach loop
        response.forEach(function(record){ 
            if(typeof record.Id != 'undefined'){ 
                var dueDate =  new Date(record.Due_Date__c);
                // based on VIP Account field value set the icon and style class to each record mportant3
                // https://www.lightningdesignsystem.com/icons/#utility 
                if(record.Status__c  != 'Completed' && ( record.Due_Date__c ==  tempDate ||  record.Due_Date__c  == tommorow  )){
                    record.showClass = (record.Status__c != 'Completed' ? 'background-color:yellow !important;' : 'color:black !important;');
                    record.displayIconName = 'utility:check';   
                }
                else if ( record.Status__c  != 'Completed' &&  dueDate.getTime() < today.getTime()  ) {
                    record.showClass = (record.Status__c != 'Completed' ? 'background-color:red !important;' : 'color:black !important;');
                    record.displayIconName = 'utility:close';     
                }
                // set the record link with record id  
                record.linkName = '/'+record.Id;   
            }
        });
        // after the loop set the updated account records on data attribute
        this.data =response;
                    this.error = undefined;
                })
                .catch(error => {
                    this.error = error;
                    this.data = undefined;
                });
        }, 100);

    })
    .catch(error => {
        window.console.log('Error ====> '+error);
        this.dispatchEvent(new ShowToastEvent({
            title: 'Error!!', 
            message: error.message, 
            variant: 'error'
        }),);
    });
}
editCurrentRecord(currentRow) {
    // open modal box  to edit the record
    this.bShowModal = true;
    this.isEditForm = true;
    
    // assign record id to the record edit form
    this.currentRecordId = currentRow.Id;
}
handleSubmit(event) {
    // prevending default type sumbit of record edit form
    event.preventDefault();

    // querying the record edit form and submiting fields to form
    this.template.querySelector('lightning-record-edit-form').submit(event.detail.fields);

    // closing modal
    this.bShowModal = false;

    // showing success message
    this.dispatchEvent(new ShowToastEvent({
        title: 'Success!!',
        message: event.detail.fields.Name + ' ' +' Contact updated Successfully!!.',
        variant: 'success'
    }),);
    this.handleSuccess();

}

 // view the current record details
 viewCurrentRecord(currentRow) {
    this.bShowModal = true;
    this.isEditForm = false;
    this.record = currentRow;
}

// closing modal box  or pop up
closeModal() {
    this.bShowModal = false;
}
// open the ew record create
 openCreateRecords() {
        this.openCreateRecord = true
    }
    closeCreateRecord() {
        this.openCreateRecord = false
    } 
    saveCreateRecord() {
        console.log('record', this.taskRecord);
        saveTask({objTask: this.taskRecord})
        .then(result => {
            // Clear the user enter values
            this.taskRecord = {};

            window.console.log('result ===> '+result);
            // Show success messsage
            this.handleSuccess();
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success!!',
                message: 'Account Created Successfully!!',
                variant: 'success'
            }),);
        })
        .catch(error => {
            this.error = error.message;
            window.console.log('result ===> '+this.error);
        });
        this.closeCreateRecord();
    }

// this function is called to refeesh the record list on the page
handleSuccess() {
    // refreshing table data using refresh apex
    this.delayTimeout = setTimeout(() => {
        getAccountList({ str : '' })
            .then(result => {
               
                var response = JSON.parse(result) ;
        var today = new Date();
        if ( today.getMonth()+1 >9 )
            {
                var tempDate = ''+today.getFullYear()+'-'+(today.getMonth()+1)+'-'+(today.getDate()+1);
                var tommorow =  ''+today.getFullYear()+'-'+(today.getMonth()+1)+'-'+(today.getDate()+2);
            }
            else
            {
                var tempDate = ''+today.getFullYear()+'-0'+(today.getMonth()+1)+'-'+(today.getDate()+1);
                var tommorow =  ''+today.getFullYear()+'-0'+(today.getMonth()+1)+'-'+(today.getDate()+2);
            }
        console.log('Success' + response);
        console.log('today',today);
        console.log('tempDate',tempDate);
        console.log('tommorow',tommorow);
        // iterate each records with forEach loop
        response.forEach(function(record){ 
            if(typeof record.Id != 'undefined'){ 
                var dueDate =  new Date(record.Due_Date__c);
                console.log('dueDate',dueDate);
                console.log('record.Due_Date__c',record.Due_Date__c);
                 // this is for the UseCase 8
                // based onvalue set the icon and style class to each record mportant3
                if(record.Status__c  != 'Completed' && ( record.Due_Date__c ==  tempDate ||  record.Due_Date__c  == tommorow  )){
                    record.showClass = (record.Status__c != 'Completed' ? 'background-color:yellow !important;' : 'color:black !important;');
                    record.displayIconName = 'utility:check';   
                }
                else if ( record.Status__c  != 'Completed' &&  dueDate.getTime() < today.getTime()  ) {
                    record.showClass = (record.Status__c != 'Completed' ? 'background-color:red !important;' : 'color:black !important;');
                    record.displayIconName = 'utility:close';     
                }
                // set the record link with record id  
                record.linkName = '/'+record.Id;   
            }
        });
        // after the loop set the updated account records on data attribute
        this.data =response;
                this.error = undefined;
            })
            .catch(error => {
                this.error = error;
                this.data = undefined;
            });
    }, 200);
}

// this is the function used to filer the record using the Apex Function
changeInFilter(event)
{
    console.log('picklist',this.picklistValue);
    this.picklistValue =  event.target.value;; 
    console.log('picklist',this.picklistValue);
    if( this.picklistValue == 'none')
    {
        this.delayTimeout = setTimeout(() => {
            getAccountList({ str : '' })
                .then(result => {
                   
                    
                var response = JSON.parse(result) ;
                var today = new Date();
                if ( today.getMonth()+1 >9 )
            {
                var tempDate = ''+today.getFullYear()+'-'+(today.getMonth()+1)+'-'+(today.getDate()+1);
                var tommorow =  ''+today.getFullYear()+'-'+(today.getMonth()+1)+'-'+(today.getDate()+2);
            }
            else
            {
                var tempDate = ''+today.getFullYear()+'-0'+(today.getMonth()+1)+'-'+(today.getDate()+1);
                var tommorow =  ''+today.getFullYear()+'-0'+(today.getMonth()+1)+'-'+(today.getDate()+2);
            }
                console.log('Success' + response);
                console.log('today',today);
                console.log('tempDate',tempDate);
                console.log('tommorow',tommorow);
                // iterate each records with forEach loop
                response.forEach(function(record){ 
                    if(typeof record.Id != 'undefined'){ 
                        var dueDate =  new Date(record.Due_Date__c);
                        console.log('dueDate',dueDate);
                        console.log('record.Due_Date__c',record.Due_Date__c);
                        // based on VIP Account field value set the icon and style class to each record mportant3
                        // https://www.lightningdesignsystem.com/icons/#utility 
                        if(record.Status__c  != 'Completed' && ( record.Due_Date__c ==  tempDate ||  record.Due_Date__c  == tommorow  )){
                            record.showClass = (record.Status__c != 'Completed' ? 'background-color:yellow !important;' : 'color:black !important;');
                            record.displayIconName = 'utility:check';   
                        }
                        else if ( record.Status__c  != 'Completed' &&  dueDate.getTime() < today.getTime()  ) {
                            record.showClass = (record.Status__c != 'Completed' ? 'background-color:red !important;' : 'color:black !important;');
                            record.displayIconName = 'utility:close';     
                        }
                        // set the record link with record id  
                        record.linkName = '/'+record.Id;   
                    }
                });
                // after the loop set the updated account records on data attribute
                this.data =response;
                    this.error = undefined;
                })
                .catch(error => {
                    this.error = error;
                    this.data = undefined;
                });
        }, 100);
    }
    else 
    {
        this.delayTimeout = setTimeout(() => {
            getTaskListWithFilter({ str : this.picklistValue })
                .then(result => {
                   
                   
                var response = JSON.parse(result) ;
                var today = new Date();
                if ( today.getMonth()+1 >9 )
            {
                var tempDate = ''+today.getFullYear()+'-'+(today.getMonth()+1)+'-'+(today.getDate()+1);
                var tommorow =  ''+today.getFullYear()+'-'+(today.getMonth()+1)+'-'+(today.getDate()+2);
            }
            else
            {
                var tempDate = ''+today.getFullYear()+'-0'+(today.getMonth()+1)+'-'+(today.getDate()+1);
                var tommorow =  ''+today.getFullYear()+'-0'+(today.getMonth()+1)+'-'+(today.getDate()+2);
            }
                console.log('Success' + response);
                console.log('today',today);
                console.log('tempDate',tempDate);
                console.log('tommorow',tommorow);
                // iterate each records with forEach loop
                response.forEach(function(record){ 
                    if(typeof record.Id != 'undefined'){ 
                        var dueDate =  new Date(record.Due_Date__c);
                        console.log('dueDate',dueDate);
                        console.log('record.Due_Date__c',record.Due_Date__c);
                        // based on VIP Account field value set the icon and style class to each record mportant3
                        // https://www.lightningdesignsystem.com/icons/#utility 
                        if(record.Status__c  != 'Completed' && ( record.Due_Date__c ==  tempDate ||  record.Due_Date__c  == tommorow  )){
                            record.showClass = (record.Status__c != 'Completed' ? 'background-color:yellow !important;' : 'color:black !important;');
                            record.displayIconName = 'utility:check';   
                        }
                        else if ( record.Status__c  != 'Completed' &&  dueDate.getTime() < today.getTime()  ) {
                            record.showClass = (record.Status__c != 'Completed' ? 'background-color:red !important;' : 'color:black !important;');
                            record.displayIconName = 'utility:close';     
                        }
                        // set the record link with record id  
                        record.linkName = '/'+record.Id;   
                    }
                });
                // after the loop set the updated account records on data attribute
                this.data =response;
                    this.error = undefined;
                })
                .catch(error => {
                    this.error = error;
                    this.data = undefined;
                });
        }, 100);
    }
   
}

// this function is used for the opening the view record pop up
openmodal() {
    this.openmodel = true
}

saveMethod() {
    alert('save method invoked');
    this.closeModal();
}

// this is used in the editing the record
handleNameChange(event) {
    this.taskRecord.Name = event.target.value;
    window.console.log('Name ==> '+this.taskRecord.Name);
}

// this is used in the editing the record
handledescriptionChange(event) {
    this.taskRecord.Description__c = event.target.value;
    window.console.log('description ==> '+this.taskRecord.Description__c);
}

// this is used in the editing the record
handlestatusChange(event) {
    this.taskRecord.Status__c = event.target.value;
    window.console.log('status ==> '+this.taskRecord.Status__c);
}

// this is used in the editing the record
handleduedateChange(event) {
    this.taskRecord.Due_Date__c = event.target.value;
    window.console.log('Due_Date ==> '+this.taskRecord.Due_Date__c);
}



}
//handle save end
//  sorting code



// sorting code end