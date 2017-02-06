//user CRUD methods we dont need create users as we use Accounts.create
Meteor.methods({

    userUpdate: function (id, doc) {
         Meteor.users.update(id, {
             $set: {
                 username: doc.username,
                 emails: doc.emails,
                 profile: doc.profile

             }
         });
        if(doc.password != "" || typeof doc.password !="undefined"){
            Accounts.setPassword(id, doc.password, function(error){
                if(error){
                    console.log(error);
                }
            });
        }
        return true;
    },

    userRemove: function(id){
        Meteor.users.remove(id);
        return id;
    },

    clearAllDraftData:function(){
        Reports.remove({});
        Draft.remove({});
        DraftTracker.remove({});
    }

});

