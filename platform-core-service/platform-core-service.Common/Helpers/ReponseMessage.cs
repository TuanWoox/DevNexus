using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Helper
{
    public static class ResponseMessage
    {
        public static string MESSAGE_TECHNICAL_ISSUE = "Sorry, the system has an unexpected technical issue.";
        public static string MESSAGE_ITEM_NOT_FOUND = "The {0} with id {1} is not existed or deleted.";
        public static string MESSAGE_ITEM_NOT_EXIST = "{0} is not found";
        public static string MESSAGE_ITEM_EXIST = "{0} already exists.";
        public static string MESSAGE_SAVE_ERROR = "Save {0} fail!";
        public static string MESSAGE_UPDATE_ERROR = "Update {0}: {1} fail!";
        public static string MESSAGE_PERK_INVALID = "Can't execute action. Please upgrade plan.";
        public static string MESSAGE_CREATE_ERROR = "Failure created";
        public static string MESSAGE_COMMON_ITEM_NOT_FOUND = "Item not found";
        public static string MESSAGE_MULTIPLE_ITEM_EXIST = "Some of the selected {0} may already exist";
        public static string MESSAGE_ALL_ITEM_NOT_FOUND = "All the items not found or have been deleted";
        public static string MESSAGE_FORBIDDEN = "Forbidden";
        public static string MESSAGE_OPERATION_CANT_BE_DONE = "The operation can't be done at the moment, please try again";
        public static string BLOCKED_OR_NOT_AVAILABLE = "Blocked or not available";
        public static string PROFILE_NOT_AVAILABLE = "Profile is not available";
        public static string CONTENT_NOT_AVAILABLE = "Content is not available";
        public static string QUESTION_NOT_AVAILABLE = "Question is not available";
        public static string COMMENT_NOT_AVAILABLE = "Comment is not available";
        public static string ANSWER_NOT_AVAILABLE = "Answer is not available";
        public static string NO_PERMISSION_TO_INTERACT = "You do not have permission to interact with this content";
        public static string NO_PERMISSION_TO_FOLLOW = "You do not have permission to follow this profile";
        public static string NO_PERMISSION_TO_VOTE = "You do not have permission to vote on this content";
        public static string NO_PERMISSION_TO_COMMENT = "You do not have permission to comment on this content";
        public static string NO_PERMISSION_TO_ANSWER = "You do not have permission to answer this question";
        public static string NO_PERMISSION_TO_SAVE = "You do not have permission to save this content";
        public static string COMMUNITY_ACCESS_REQUIRED = "Community access is required";
        public static string CONTENT_PENDING_OR_HIDDEN = "Content is pending or hidden";
        public static string TARGET_NOT_FOUND = "Target not found";
    }
}
