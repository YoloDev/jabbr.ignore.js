// ==UserScript==
// @name      JabbR Ignore Script
// @namespace  http://ignore.buildstarted.com/
// @version    0.2
// @description  Ignores users in a persistent basis
// @match      https://jabbr.net/*
// @copyright  2012+, You
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==

var ignoredUsers = [];
var usernames = [];

if (unsafeWindow.localStorage["ignored-users"]) {
    ignoredUsers = JSON.parse(unsafeWindow.localStorage["ignored-users"]);
}
if (unsafeWindow.localStorage["banned-users"]) {
	usernames = JSON.parse(unsafeWindow.localStorage["banned-users"]);
}

unsafeWindow.$.connection.chat.server.updateActivity = function() {
    var def = $.Deferred();
    def.resolve();
    return def;
}

var origChatMessageHandler = unsafeWindow.chat.ui.addChatMessage;
unsafeWindow.chat.ui.addChatMessage = function (message, roomName) {
    if (unsafeWindow.$.inArray(message.name, ignoredUsers) > -1) {
        console.info('message from:', message.name, 'ignored');
        return;
    } else {
        origChatMessageHandler.apply(this, [message, roomName]);
    }
}
var origAddUserHandler = unsafeWindow.$.connection.chat.client.addUser;
unsafeWindow.$.connection.chat.client.addUser = function (user, room, isOwner) {
    if (unsafeWindow.$.inArray(user.Name, usernames) > -1) {
        var newId = unsafeWindow.chat.utility.newId();
        var activeRoom = unsafeWindow.$.connection.chat.state.activeRoom;
        unsafeWindow.$.connection.chat.server.send({id:newId, content:"/kick " + user.Name, room: activeRoom});
        return;
    }
    origAddUserHandler(user,room,isOwner);
};

var origSendMessageHandler = unsafeWindow.$(unsafeWindow.chat.ui).data('events').jabbr[2].handler;
unsafeWindow.$(unsafeWindow.chat.ui).unbind(unsafeWindow.chat.ui.events.sendMessage);
unsafeWindow.$(unsafeWindow.chat.ui).bind(unsafeWindow.chat.ui.events.sendMessage, function(ev, msg, msgId, isCommand) {
    if (msg[0] === '/') {
        var parts = msg.substr(1).split(' ');
        if (parts.length > 0) {
            switch(parts[0]) {
                case 'ignore':
                    var username = parts[1];
                    if (username[0] === '@') {
                        username = username.substring(1);
                    }
                    unsafeWindow.chat.ui.addNotificationToActiveRoom("adding '" + username + "' to ignore list");
                    ignoredUsers.push(username);
                    unsafeWindow.localStorage["ignored-users"] = JSON.stringify(ignoredUsers);
                    return;
                case 'unignore':
                    var username = parts[1];
                    if (username[0] === '@') {
                        username = username.substring(1);
                    }
                    unsafeWindow.chat.ui.addNotificationToActiveRoom("removing '" + username + "' from ignore list");
                    ignoredUsers.splice(ignoredUsers.indexOf(username), 1);
                    unsafeWindow.localStorage["ignored-users"] = JSON.stringify(ignoredUsers);
                    return;
                case 'ignored':
					unsafeWindow.chat.ui.addNotificationToActiveRoom("ignored users:" + ignoredUsers.join(", "));
                    return;
                case 'push':
                    var username = parts[1];
                    if (username[0] === '@') {
                        username = username.substring(1);
                    }
                    unsafeWindow.chat.ui.addNotificationToActiveRoom("adding '" + username + "' from ban list");
                    usernames.push(username);
                    unsafeWindow.localStorage["banned-users"] = JSON.stringify(usernames);
                    return;
                case 'pop':
                    var username = parts[1];
                    if (username[0] === '@') {
                        username = username.substring(1);
                    }
                    unsafeWindow.chat.ui.addNotificationToActiveRoom("removing '" + username + "' from ban list");
                    usernames.splice(usernames.indexOf(username), 1);
                    unsafeWindow.localStorage["banned-users"] = JSON.stringify(usernames);
                    return;
            }
        }
    }
    
    origSendMessageHandler.apply(this, [ev, msg, msgId, isCommand]);
});
