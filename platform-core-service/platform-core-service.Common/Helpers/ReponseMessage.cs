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
    }
}
