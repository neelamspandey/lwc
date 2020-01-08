public class TaskController {
    
    @AuraEnabled(cacheable=true)
    public static String getTaskList( String str) {
        System.debug('str'+str);
        list<Task__c> accounts  = new list<Task__c>();
        if(str  != null  && str != '')
        {
            accounts  =  [SELECT Id, Name,Description__c,Status__c,Due_Date__c FROM Task__c WHERE Name=:str  ];  
        }
        else
        {
            accounts  =  [SELECT Id, Name,Description__c,Status__c,Due_Date__c FROM Task__c  ];  
        }
        
        String strjson =   JSON.serialize(accounts);
        return strjson;
    }
    @AuraEnabled(cacheable=true)
    public static String getTaskListWithFilter( String str) {
        System.debug('str'+str);
        list<Task__c> accounts  = new list<Task__c>();
        date d = Date.newInstance(Date.today().year(),Date.today().month(),Date.today().day()+1);

        if(str  == 'due')
        {
            accounts  =  [SELECT Id, Name,Description__c,Status__c,Due_Date__c FROM Task__c WHERE Due_Date__c<:Date.today()  AND Status__c != 'Completed' ];  
        }
        else if( str == 'notdue')
        {
            accounts  =  [SELECT Id, Name,Description__c,Status__c,Due_Date__c FROM Task__c   WHERE Due_Date__c >=:Date.today() OR Status__c = 'Completed'   ];  
        }
         else if( str == 'dueToday')
        {
            accounts  =  [SELECT Id, Name,Description__c,Status__c,Due_Date__c FROM Task__c   WHERE Due_Date__c =:Date.today() AND Status__c != 'Completed' ];  
        }
         else if( str == 'dueTommorow')
        {
            accounts  =  [SELECT Id, Name,Description__c,Status__c,Due_Date__c FROM Task__c   WHERE Due_Date__c =:d  AND Status__c != 'Completed'  ];  
        }
        else if( str == 'completed')
        {
            accounts  =  [SELECT Id, Name,Description__c,Status__c,Due_Date__c FROM Task__c   WHERE  Status__c = 'Completed'  ];
        }
        String strjson =   JSON.serialize(accounts);
        return strjson;
    }
    @AuraEnabled
    public static void deleteTasks(list<Id> lstConIds){
        try {
            list<Task__c> lstConsToDelete = new list<Task__c>();
            System.debug('lstConIds ====> '+lstConIds);
            for(Id idCon : lstConIds) {
                lstConsToDelete.add(new Task__c(Id = idCon));
            }
            if(!lstConsToDelete.isEmpty()) {
                delete lstConsToDelete;
            }
        }
        catch(Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }
     @AuraEnabled
    public static void saveTaskRecord(Task__c objTask){
        try{
            system.debug('record'+objTask);
            insert objTask;
        }
        catch(Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }
}