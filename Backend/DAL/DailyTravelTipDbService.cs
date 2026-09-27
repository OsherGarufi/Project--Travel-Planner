using Backend.Models;
using Npgsql;
using NpgsqlTypes;

namespace Backend.DAL;

public sealed class DailyTravelTipDbService
{
    private readonly IConfiguration _configuration;

    public DailyTravelTipDbService(
        IConfiguration configuration
    )
    {
        _configuration = configuration;
    }

    public async Task<DailyTravelTip?> GetByDateAsync(
        DateOnly tipDate,
        CancellationToken cancellationToken = default
    )
    {
        await using var connection =
            new NpgsqlConnection(
                GetConnectionString()
            );

        await connection.OpenAsync(
            cancellationToken
        );

        const string sql = """
        SELECT
            tip_date,
            title,
            tip,
            created_at
        FROM daily_travel_tips
        WHERE tip_date = @tip_date
        LIMIT 1;
        """;

        await using var command =
            new NpgsqlCommand(
                sql,
                connection
            );

        AddDateParameter(
            command,
            "tip_date",
            tipDate
        );

        await using var reader =
            await command.ExecuteReaderAsync(
                cancellationToken
            );

        return await reader.ReadAsync(
            cancellationToken
        )
            ? MapTip(reader)
            : null;
    }

    public async Task<DailyTravelTip?> GetLatestBeforeAsync(
        DateOnly tipDate,
        CancellationToken cancellationToken = default
    )
    {
        await using var connection =
            new NpgsqlConnection(
                GetConnectionString()
            );

        await connection.OpenAsync(
            cancellationToken
        );

        const string sql = """
        SELECT
            tip_date,
            title,
            tip,
            created_at
        FROM daily_travel_tips
        WHERE tip_date < @tip_date
        ORDER BY tip_date DESC
        LIMIT 1;
        """;

        await using var command =
            new NpgsqlCommand(
                sql,
                connection
            );

        AddDateParameter(
            command,
            "tip_date",
            tipDate
        );

        await using var reader =
            await command.ExecuteReaderAsync(
                cancellationToken
            );

        return await reader.ReadAsync(
            cancellationToken
        )
            ? MapTip(reader)
            : null;
    }

    public async Task<IReadOnlyList<string>> GetRecentTitlesAsync(
        DateOnly beforeDate,
        int limit,
        CancellationToken cancellationToken = default
    )
    {
        await using var connection =
            new NpgsqlConnection(
                GetConnectionString()
            );

        await connection.OpenAsync(
            cancellationToken
        );

        const string sql = """
        SELECT title
        FROM daily_travel_tips
        WHERE tip_date < @before_date
        ORDER BY tip_date DESC
        LIMIT @limit;
        """;

        await using var command =
            new NpgsqlCommand(
                sql,
                connection
            );

        AddDateParameter(
            command,
            "before_date",
            beforeDate
        );

        command.Parameters.AddWithValue(
            "limit",
            limit
        );

        var titles = new List<string>();

        await using var reader =
            await command.ExecuteReaderAsync(
                cancellationToken
            );

        while (
            await reader.ReadAsync(
                cancellationToken
            )
        )
        {
            titles.Add(
                reader.GetString(0)
            );
        }

        return titles;
    }

    public async Task<bool> TryInsertBatchAsync(
        IReadOnlyList<DailyTravelTip> tips,
        CancellationToken cancellationToken = default
    )
    {
        if (tips.Count == 0)
        {
            throw new ArgumentException(
                "At least one daily travel tip is required.",
                nameof(tips)
            );
        }

        await using var connection =
            new NpgsqlConnection(
                GetConnectionString()
            );

        await connection.OpenAsync(
            cancellationToken
        );

        await using var transaction =
            await connection.BeginTransactionAsync(
                cancellationToken
            );

        try
        {
            var valueRows = new List<string>(
                tips.Count
            );

            await using var command =
                new NpgsqlCommand
                {
                    Connection = connection,
                    Transaction = transaction
                };

            for (var index = 0; index < tips.Count; index++)
            {
                var tip = tips[index];

                valueRows.Add(
                    $"(@tip_date_{index}, @title_{index}, @tip_{index})"
                );

                AddDateParameter(
                    command,
                    $"tip_date_{index}",
                    tip.TipDate
                );

                command.Parameters.AddWithValue(
                    $"title_{index}",
                    tip.Title
                );

                command.Parameters.AddWithValue(
                    $"tip_{index}",
                    tip.Tip
                );
            }

            command.CommandText = $"""
                INSERT INTO daily_travel_tips (
                    tip_date,
                    title,
                    tip
                )
                VALUES
                    {string.Join(",\n    ", valueRows)}
                ON CONFLICT (tip_date) DO NOTHING;
                """;

            var insertedCount =
                await command.ExecuteNonQueryAsync(
                    cancellationToken
                );

            if (insertedCount != tips.Count)
            {
                await transaction.RollbackAsync(
                    cancellationToken
                );

                return false;
            }

            await transaction.CommitAsync(
                cancellationToken
            );

            return true;
        }
        catch
        {
            await transaction.RollbackAsync(
                CancellationToken.None
            );

            throw;
        }
    }

    private string GetConnectionString()
    {
        var connectionString =
            _configuration.GetConnectionString(
                "DefaultConnection"
            );

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Missing database connection string."
            );
        }

        return connectionString;
    }

    private static void AddDateParameter(
        NpgsqlCommand command,
        string name,
        DateOnly value
    )
    {
        command.Parameters.AddWithValue(
            name,
            NpgsqlDbType.Date,
            value
        );
    }

    private static DailyTravelTip MapTip(
        NpgsqlDataReader reader
    )
    {
        return new DailyTravelTip
        {
            TipDate = reader.GetFieldValue<DateOnly>(0),
            Title = reader.GetString(1),
            Tip = reader.GetString(2),
            CreatedAt = reader.GetDateTime(3)
        };
    }
}
