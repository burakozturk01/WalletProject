namespace Src.Database
{
    public static class DatabaseConstants
    {
        public static class TableNames
        {
            public const string Users = "Users";
            public const string Accounts = "Accounts";
            public const string Transactions = "Transactions";
            public const string CoreDetailsComponents = "CoreDetailsComponents";
            public const string ActiveAccountComponents = "ActiveAccountComponents";
            public const string SpendingLimitComponents = "SpendingLimitComponents";
            public const string SavingGoalComponents = "SavingGoalComponents";
        }

        public static class SqliteSystemTables
        {
            public const string Sequence = "sqlite_sequence";
        }
        
        public static string[] GetTableDeletionOrder()
        {
            return new[]
            {
                TableNames.Transactions, // First, delete transactions (they reference accounts)
                TableNames.CoreDetailsComponents, // Delete components (they reference accounts)
                TableNames.ActiveAccountComponents,
                TableNames.SpendingLimitComponents,
                TableNames.SavingGoalComponents,
                TableNames.Accounts, // Delete accounts (they reference users)
                TableNames.Users // Finally, delete users
            };
        }
    }
}
