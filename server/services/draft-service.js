import { Meteor } from 'meteor/meteor';
import staticBlinds from "../static/blindslist";
import * as _ from 'lodash';

var DraftPickTimeMS = 15*1000;
var DraftTimer = {};
var DraftInterval = {};

var startDraft = function(draft) {
    console.log('building draft');
    buildDraftOrder(draft);
   // draft.startedBy = Meteor.userId();
    draft.startDate = new Date();
    draft.status = "active";
    draft.blinds = staticBlinds;
    _.forEach(draft.blinds, function(blind) {
     blind.selected = false;
    });

    var draftid = Draft.insert(draft);
    createDraftTracker(draftid);

   // console.log('created draft:', draftid);
    return draft;
};

var pickBlind = function(draftid, blind) {
    var draft = Draft.findOne({_id: draftid});
    var selection = _.find(draft.selections, ['userId', Meteor.userId()]);
    selection.blind = blind;
    //console.log('finding blind: ', blind.name, draft.blinds);
    var selectedblind = _.find(draft.blinds, ['name', blind]);
    selectedblind.selected = true;
   // selectedblind.selectedAt = new Date(); not sure we need this unless we want hour, we have date for when draft started
    selectedblind.selectedBy = selection.username;
    selection.date = new Date();
    selection.order = draft.order.indexOf(Meteor.userId());
    if(!draft.audit){
        draft.audit=[];
    }
    draft.audit.push(selection);
    Draft.update(draftid, draft);
    endPick(DraftTracker.findOne({draft_id: draft._id}));
};

var endDraft = function(draftid) {
   //console.log('ending draft:', draftid);
   var draft = Draft.findOne(draftid);
   var tracker = DraftTracker.findOne({draft_id: draft._id});

   //if (Meteor.userId() == draft.startedBy) {
       draft.status = "complete";
       Draft.update(draftid, draft);
       clearTimeout(DraftTimer[tracker._id]);
       clearInterval(DraftInterval[tracker._id]);
       buildReports(draftid);
   //}
};

var buildDraftOrder = function(draft) {
    var members = Meteor.users.find({"profile.isMember": true}).fetch();
    totalNumberOfPicks = members.length;
    members = _.shuffle(members);
    draft.order = [];
    draft.selections = [];
    for (var m = 0; m < members.length; m++) {
        var selection = {
            userId: members[m]._id,
            username: members[m].username
        };
        draft.order.push(members[m]._id);
        draft.selections.push(selection);
    }
    //console.log('draft order', draft.order, draft.selections);
};


var createDraftTracker = function(draftid) {
    var draft = Draft.findOne(draftid);
    var tracker = {draft_id: draftid};
    tracker.start = draft.startDate;
    tracker.timeLeft = DraftPickTimeMS/1000;
    tracker.end = new Date(draft.startDate.getTime() + DraftPickTimeMS);
    tracker.count = 0;
    tracker.userId = draft.selections[tracker.count].userId;
    var trackerid = DraftTracker.insert(tracker);

    setDraftTimer(trackerid);
    setDraftInterval(trackerid);
};

var endPick = function(tracker) {
    var draft = Draft.findOne(tracker.draft_id);
    if (tracker.count >= draft.order.length-1) {
       // endDraft(draft._id);
        draft.status = "open"; //anyone can pick now
        Draft.update(draft._id, draft);
    } else {
        tracker.count++;
        tracker.userId = draft.selections[tracker.count].userId;
        tracker.start = new Date();
        var currentUserPicking = Meteor.users.findOne({"_id":tracker.userId});
        //console.log('user picking', currentUserPicking);
        tracker.timeLeft = DraftPickTimeMS/1000;
        tracker.end = new Date(tracker.start.getTime() + DraftPickTimeMS);
        DraftTracker.update(tracker._id, tracker);
        clearTimeout(DraftTimer[tracker._id]);
        setDraftTimer(tracker._id);
    }
    return tracker;
};

var setDraftTimer = function(trackerid, timeleft) {
    var timeleft = timeleft || DraftPickTimeMS;
    var timeoutFunction = function(trackerid) {
        //console.log('timer draft id: ', trackerid);
        return function() {
            //console.log('timer draft id: ', trackerid);
            var tracker = DraftTracker.findOne(trackerid);
            endPick(tracker);
            DraftTracker.update(tracker._id, tracker);
        };
    }(trackerid);

    DraftTimer[trackerid] = Meteor.setTimeout(timeoutFunction, timeleft);
};

var setDraftInterval = function(trackerid) {
    var intervalFunction = function(trackerid) {
        return function() {
            var tracker = DraftTracker.findOne(trackerid);
            var now = new Date();
            var timeleft = Math.round((tracker.end.getTime() - now.getTime())/1000);
            if(timeleft <=0){
                timeleft=0;
            }
            //console.log('Updating timeleft: ', timeleft);
            DraftTracker.update(trackerid, {"$set": {"timeLeft": timeleft}});
        };
    }(trackerid);

    DraftInterval[trackerid] = Meteor.setInterval(intervalFunction, 1000);
};

var releaseBlind = function(draftid){
    var draft = Draft.findOne({_id: draftid});
    var selection = _.find(draft.selections, ['userId', Meteor.userId()]);
    var blind = selection.blind;
    var blindObj = _.find(draft.blinds,['name',blind]);
    blindObj.selected = false;
    delete blindObj.selectedBy;
    delete selection.blind;
    Draft.update(draftid, draft);
};

var buildReports = function(draftId){
    var draft = Draft.findOne({_id: draftId});
    var reportObj = {
        "draftId":draft._id,
        "draftDate":draft.startDate,
        "selections":draft.audit
    };
    Reports.insert(reportObj);
};
//call from client using Meteor.call
Meteor.methods({
    startDraft: startDraft,
    pick: pickBlind,
    release:releaseBlind,
    endDraft: endDraft
});
//Call from server side using import functionName
module.exports = {
    createDraftTracker: createDraftTracker,
    setDraftInterval: setDraftInterval,
    setDraftTimer: setDraftTimer,
    startDraft: startDraft,
    endDraft: endDraft
};
