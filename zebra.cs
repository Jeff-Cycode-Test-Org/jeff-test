      public static int ExecuteNonQueryStoredProcedure(SqlConnection connection, string storedProcedureName, SqlParameter[] parameters, ExternalTransaction externalTransaction = null, int? timeout = null)
        {
            var retval = -1;
 
            using (var sqlCommand = new SqlCommand(storedProcedureName, connection))
            {
 
                if (externalTransaction != null)
                {
                    sqlCommand.Transaction = externalTransaction.Transaction;
                }
 
                if (timeout.HasValue)
                {
                    sqlCommand.CommandTimeout = timeout.Value;
                }
 
                sqlCommand.CommandType = CommandType.StoredProcedure;
                sqlCommand.Parameters.AddRange(parameters);
 
                retval = sqlCommand.ExecuteNonQuery();
            }
 
            return retval;
        }
 
