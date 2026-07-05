using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MytechERP.domain.Roles
{
    public static class Roles
    {
        public const string Admin = "Admin";
        public const string Manager = "Manager";
        public const string Engineer = "Engineer";
        public const string Estimation = "Estimation";

        public const string Technician = "Technician";
        public const string Customers = "Customer";
        public const string Salesman = "Salesman";
        public const string Worker = "Worker"; // Added just in case
        public const string AccountsHead = "Accounts Head";
        public const string SoftwareDeveloper = "Software Developer";

        public const string ProcurementHead = "Procurement Head";
        public const string ProcurementExecutive = "Procurement Executive";
        public const string SiteSupervisor = "Site Supervisor";
        public const string TemporaryEmployee = "Temporary Employee";
        public const string PermanentEmployee = "Permanent Employee";
        public const string AccountsAssistant = "Accounts Assistant";
        public const string DocumentController = "Document Controller";
        public const string RegionalHead = "Regional Head";

        public const string AllInternal = Admin + "," + Manager + "," + Engineer + "," + Estimation + "," + Technician + "," + Salesman + "," + Worker + "," + AccountsHead + "," + SoftwareDeveloper + "," + ProcurementHead + "," + ProcurementExecutive + "," + SiteSupervisor + "," + TemporaryEmployee + "," + PermanentEmployee + "," + AccountsAssistant + "," + DocumentController + "," + RegionalHead;
    }
}
