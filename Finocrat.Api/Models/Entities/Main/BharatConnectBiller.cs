namespace Finocrat.Api.Models.Entities.Main
{
    public class BharatConnectBiller
    {
        public int Id { get; set; }

        /// <summary>
        /// Unique biller ID from Bharat Connect
        /// </summary>
        public string BlrId { get; set; }

        /// <summary>
        /// Name of the biller/service provider
        /// </summary>
        public string BlrName { get; set; }

        /// <summary>
        /// Alternate name for the biller
        /// </summary>
        public string BlrAliasName { get; set; }

        /// <summary>
        /// Category of bills (e.g., Loan Repayment, Education Fees, etc.)
        /// </summary>
        public string BlrCategoryName { get; set; }

        /// <summary>
        /// Coverage area code (e.g., IND, IND-DEL, IND-KAR)
        /// </summary>
        public string BlrCoverage { get; set; }

        /// <summary>
        /// Record creation timestamp
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Whether this biller is active
        /// </summary>
        public bool IsActive { get; set; } = true;

        public string? IconUrl { get; set; }
        public string? BillerInfo { get; set;  }
    }
}
