using Backend.DAL;
using Backend.Dtos.Expenses;
using Backend.Dtos.Itinerary;
using Backend.Models;
using Npgsql;

namespace Backend.Services;

public class ItineraryExpenseService
{
    private readonly IConfiguration _configuration;
    private readonly ExpenseDbService _expenseDbService;
    private readonly ItineraryDbService _itineraryDbService;

    public ItineraryExpenseService(
        IConfiguration configuration,
        ExpenseDbService expenseDbService,
        ItineraryDbService itineraryDbService
    )
    {
        _configuration = configuration;
        _expenseDbService = expenseDbService;
        _itineraryDbService = itineraryDbService;
    }

    /// <summary>
    /// Creates an itinerary item.
    ///
    /// Free activities are stored only in the itinerary.
    /// Paid activities create and link an expense inside the
    /// same database transaction.
    /// </summary>
    public async Task<TripItineraryItemResponse?>
        CreateItineraryItemAsync(
            Guid tripId,
            Guid userId,
            CreateTripItineraryItemRequest request
        )
    {
        if (!HasPositiveCost(request))
        {
            var itineraryItem =
                await _itineraryDbService
                    .CreateTripItineraryItemForUserAsync(
                        tripId,
                        userId,
                        request
                    );

            return itineraryItem is null
                ? null
                : MapItineraryResponse(
                    itineraryItem,
                    cost: null,
                    currency: null
                );
        }

        EnsureCurrencyForPaidActivity(
            request
        );

        await using var connection =
            new NpgsqlConnection(
                GetConnectionString()
            );

        await connection.OpenAsync();

        await using var transaction =
            await connection.BeginTransactionAsync();

        try
        {
            var expense =
                await _expenseDbService
                    .CreateTripExpenseForUserAsync(
                        connection,
                        transaction,
                        tripId,
                        userId,
                        CreateExpenseRequest(
                            request
                        )
                    );

            if (expense is null)
            {
                await transaction.RollbackAsync();

                return null;
            }

            var itineraryItem =
                await _itineraryDbService
                    .CreateTripItineraryItemForUserAsync(
                        connection,
                        transaction,
                        tripId,
                        userId,
                        expense.Id,
                        request
                    );

            if (itineraryItem is null)
            {
                await transaction.RollbackAsync();

                return null;
            }

            await transaction.CommitAsync();

            return MapItineraryResponse(
                itineraryItem,
                expense.Amount,
                expense.Currency
            );
        }
        catch
        {
            await transaction.RollbackAsync();

            throw;
        }
    }

    /// <summary>
    /// Creates an expense.
    ///
    /// When no itinerary information is supplied, a standalone
    /// expense is created.
    ///
    /// When itinerary information is supplied, the expense and
    /// linked itinerary activity are created atomically inside
    /// the same database transaction.
    /// </summary>
    public async Task<TripExpenseResponse?>
        CreateExpenseAsync(
            Guid tripId,
            Guid userId,
            CreateTripExpenseWithItineraryRequest request
        )
    {
        var expenseRequest =
            CreateStandaloneExpenseRequest(
                request
            );

        if (request.Itinerary is null)
        {
            var expense =
                await _expenseDbService
                    .CreateTripExpenseForUserAsync(
                        tripId,
                        userId,
                        expenseRequest
                    );

            return expense is null
                ? null
                : MapExpenseResponse(
                    expense,
                    itineraryItem: null
                );
        }

        await using var connection =
            new NpgsqlConnection(
                GetConnectionString()
            );

        await connection.OpenAsync();

        await using var transaction =
            await connection.BeginTransactionAsync();

        try
        {
            var expense =
                await _expenseDbService
                    .CreateTripExpenseForUserAsync(
                        connection,
                        transaction,
                        tripId,
                        userId,
                        expenseRequest
                    );

            if (expense is null)
            {
                await transaction.RollbackAsync();

                return null;
            }

            var itineraryRequest =
                CreateItineraryRequestFromExpense(
                    request
                );

            var itineraryItem =
                await _itineraryDbService
                    .CreateTripItineraryItemForUserAsync(
                        connection,
                        transaction,
                        tripId,
                        userId,
                        expense.Id,
                        itineraryRequest
                    );

            if (itineraryItem is null)
            {
                await transaction.RollbackAsync();

                return null;
            }

            await transaction.CommitAsync();

            return MapExpenseResponse(
                expense,
                itineraryItem
            );
        }
        catch
        {
            await transaction.RollbackAsync();

            throw;
        }
    }

    /// <summary>
    /// Updates an itinerary item and keeps its linked expense
    /// synchronized inside one database transaction.
    ///
    /// Supported transitions:
    /// Free -> Free
    /// Free -> Paid
    /// Paid -> Paid
    /// Paid -> Free
    /// </summary>
    public async Task<TripItineraryItemResponse?>
        UpdateItineraryItemAsync(
            Guid tripId,
            Guid itemId,
            Guid userId,
            UpdateTripItineraryItemRequest request
        )
    {
        if (HasPositiveCost(request))
        {
            EnsureCurrencyForPaidActivity(
                request
            );
        }

        await using var connection =
            new NpgsqlConnection(
                GetConnectionString()
            );

        await connection.OpenAsync();

        await using var transaction =
            await connection.BeginTransactionAsync();

        try
        {
            var currentItem =
                await _itineraryDbService
                    .GetTripItineraryItemForUserAsync(
                        connection,
                        transaction,
                        tripId,
                        itemId,
                        userId
                    );

            if (currentItem is null)
            {
                await transaction.RollbackAsync();

                return null;
            }

            var currentlyPaid =
                currentItem.ExpenseId.HasValue;

            var shouldBePaid =
                HasPositiveCost(request);

            TripItineraryItem? updatedItem;

            if (
                !currentlyPaid &&
                !shouldBePaid
            )
            {
                updatedItem =
                    await _itineraryDbService
                        .UpdateTripItineraryItemForUserAsync(
                            connection,
                            transaction,
                            tripId,
                            itemId,
                            userId,
                            request
                        );

                if (updatedItem is null)
                {
                    await transaction.RollbackAsync();

                    return null;
                }

                await transaction.CommitAsync();

                return MapItineraryResponse(
                    updatedItem,
                    cost: null,
                    currency: null
                );
            }

            if (
                !currentlyPaid &&
                shouldBePaid
            )
            {
                updatedItem =
                    await _itineraryDbService
                        .UpdateTripItineraryItemForUserAsync(
                            connection,
                            transaction,
                            tripId,
                            itemId,
                            userId,
                            request
                        );

                if (updatedItem is null)
                {
                    await transaction.RollbackAsync();

                    return null;
                }

                var expense =
                    await _expenseDbService
                        .CreateTripExpenseForUserAsync(
                            connection,
                            transaction,
                            tripId,
                            userId,
                            CreateExpenseRequest(
                                request
                            )
                        );

                if (expense is null)
                {
                    await transaction.RollbackAsync();

                    return null;
                }

                updatedItem =
                    await _itineraryDbService
                        .AttachExpenseToItineraryItemForUserAsync(
                            connection,
                            transaction,
                            tripId,
                            itemId,
                            expense.Id,
                            userId
                        );

                if (updatedItem is null)
                {
                    await transaction.RollbackAsync();

                    return null;
                }

                await transaction.CommitAsync();

                return MapItineraryResponse(
                    updatedItem,
                    expense.Amount,
                    expense.Currency
                );
            }

            if (
                currentlyPaid &&
                shouldBePaid
            )
            {
                updatedItem =
                    await _itineraryDbService
                        .UpdateTripItineraryItemForUserAsync(
                            connection,
                            transaction,
                            tripId,
                            itemId,
                            userId,
                            request
                        );

                if (updatedItem is null)
                {
                    await transaction.RollbackAsync();

                    return null;
                }

                var expense =
                    await _expenseDbService
                        .UpdateTripExpenseForUserAsync(
                            connection,
                            transaction,
                            tripId,
                            currentItem.ExpenseId!.Value,
                            userId,
                            CreateUpdateExpenseRequest(
                                request
                            )
                        );

                if (expense is null)
                {
                    await transaction.RollbackAsync();

                    return null;
                }

                await transaction.CommitAsync();

                return MapItineraryResponse(
                    updatedItem,
                    expense.Amount,
                    expense.Currency
                );
            }

            updatedItem =
                await _itineraryDbService
                    .UpdateTripItineraryItemForUserAsync(
                        connection,
                        transaction,
                        tripId,
                        itemId,
                        userId,
                        request
                    );

            if (updatedItem is null)
            {
                await transaction.RollbackAsync();

                return null;
            }

            var expenseWasDeleted =
                await _expenseDbService
                    .DeleteTripExpenseForUserAsync(
                        connection,
                        transaction,
                        tripId,
                        currentItem.ExpenseId!.Value,
                        userId
                    );

            if (!expenseWasDeleted)
            {
                await transaction.RollbackAsync();

                return null;
            }

            updatedItem.ExpenseId = null;

            await transaction.CommitAsync();

            return MapItineraryResponse(
                updatedItem,
                cost: null,
                currency: null
            );
        }
        catch
        {
            await transaction.RollbackAsync();

            throw;
        }
    }

    /// <summary>
    /// Updates an expense and synchronizes its linked itinerary
    /// item inside the same database transaction.
    ///
    /// Itinerary scheduling fields are deliberately preserved.
    /// </summary>
    public async Task<TripExpenseResponse?>
        UpdateExpenseAsync(
            Guid tripId,
            Guid expenseId,
            Guid userId,
            UpdateTripExpenseRequest request
        )
    {
        await using var connection =
            new NpgsqlConnection(
                GetConnectionString()
            );

        await connection.OpenAsync();

        await using var transaction =
            await connection.BeginTransactionAsync();

        try
        {
            var linkedItineraryItem =
                await _itineraryDbService
                    .GetLinkedItineraryItemForExpenseAsync(
                        connection,
                        transaction,
                        tripId,
                        expenseId,
                        userId
                    );

            TripItineraryItem? updatedItineraryItem =
                null;

            if (linkedItineraryItem is not null)
            {
                var itineraryRequest =
                    CreateItineraryUpdateRequestFromExpense(
                        request,
                        linkedItineraryItem
                    );

                updatedItineraryItem =
                    await _itineraryDbService
                        .UpdateTripItineraryItemForUserAsync(
                            connection,
                            transaction,
                            tripId,
                            linkedItineraryItem.Id,
                            userId,
                            itineraryRequest
                        );

                if (updatedItineraryItem is null)
                {
                    await transaction.RollbackAsync();

                    return null;
                }
            }

            var updatedExpense =
                await _expenseDbService
                    .UpdateTripExpenseForUserAsync(
                        connection,
                        transaction,
                        tripId,
                        expenseId,
                        userId,
                        request
                    );

            if (updatedExpense is null)
            {
                await transaction.RollbackAsync();

                return null;
            }

            await transaction.CommitAsync();

            return MapExpenseResponse(
                updatedExpense,
                updatedItineraryItem
            );
        }
        catch
        {
            await transaction.RollbackAsync();

            throw;
        }
    }

    /// <summary>
    /// Deletes an itinerary item.
    ///
    /// A free activity is deleted by itself.
    /// A paid activity deletes both the itinerary item and its
    /// linked expense inside the same transaction.
    /// </summary>
    public async Task<bool>
        DeleteItineraryItemAsync(
            Guid tripId,
            Guid itemId,
            Guid userId
        )
    {
        await using var connection =
            new NpgsqlConnection(
                GetConnectionString()
            );

        await connection.OpenAsync();

        await using var transaction =
            await connection.BeginTransactionAsync();

        try
        {
            var currentItem =
                await _itineraryDbService
                    .GetTripItineraryItemForUserAsync(
                        connection,
                        transaction,
                        tripId,
                        itemId,
                        userId
                    );

            if (currentItem is null)
            {
                await transaction.RollbackAsync();

                return false;
            }

            var expenseId =
                currentItem.ExpenseId;

            var itineraryWasDeleted =
                await _itineraryDbService
                    .DeleteTripItineraryItemForUserAsync(
                        connection,
                        transaction,
                        tripId,
                        itemId,
                        userId
                    );

            if (!itineraryWasDeleted)
            {
                await transaction.RollbackAsync();

                return false;
            }

            if (expenseId.HasValue)
            {
                var expenseWasDeleted =
                    await _expenseDbService
                        .DeleteTripExpenseForUserAsync(
                            connection,
                            transaction,
                            tripId,
                            expenseId.Value,
                            userId
                        );

                if (!expenseWasDeleted)
                {
                    await transaction.RollbackAsync();

                    return false;
                }
            }

            await transaction.CommitAsync();

            return true;
        }
        catch
        {
            await transaction.RollbackAsync();

            throw;
        }
    }

    /// <summary>
    /// Deletes an expense according to the relationship with
    /// its linked itinerary item.
    ///
    /// Unlinked expenses are deleted directly.
    ///
    /// Linked expenses require an explicit decision:
    /// false -> delete only the expense and keep the activity
    ///          as a free itinerary item.
    /// true  -> delete both the expense and the activity.
    /// null  -> do not delete and require a user decision.
    /// </summary>
    public async Task<ExpenseDeleteResult>
        DeleteExpenseAsync(
            Guid tripId,
            Guid expenseId,
            Guid userId,
            bool? deleteLinkedActivity
        )
    {
        await using var connection =
            new NpgsqlConnection(
                GetConnectionString()
            );

        await connection.OpenAsync();

        await using var transaction =
            await connection.BeginTransactionAsync();

        try
        {
            var linkedItineraryItem =
                await _itineraryDbService
                    .GetLinkedItineraryItemForExpenseAsync(
                        connection,
                        transaction,
                        tripId,
                        expenseId,
                        userId
                    );

            if (
                linkedItineraryItem is not null &&
                !deleteLinkedActivity.HasValue
            )
            {
                await transaction.RollbackAsync();

                return
                    ExpenseDeleteResult
                        .LinkedActivityChoiceRequired;
            }

            if (
                linkedItineraryItem is not null &&
                deleteLinkedActivity == true
            )
            {
                var itineraryWasDeleted =
                    await _itineraryDbService
                        .DeleteTripItineraryItemForUserAsync(
                            connection,
                            transaction,
                            tripId,
                            linkedItineraryItem.Id,
                            userId
                        );

                if (!itineraryWasDeleted)
                {
                    await transaction.RollbackAsync();

                    return ExpenseDeleteResult.NotFound;
                }
            }

            var expenseWasDeleted =
                await _expenseDbService
                    .DeleteTripExpenseForUserAsync(
                        connection,
                        transaction,
                        tripId,
                        expenseId,
                        userId
                    );

            if (!expenseWasDeleted)
            {
                await transaction.RollbackAsync();

                return ExpenseDeleteResult.NotFound;
            }

            /*
             * When the expense is linked and
             * deleteLinkedActivity == false,
             * the FK uses ON DELETE SET NULL.
             *
             * Therefore the itinerary item remains and
             * automatically becomes a free activity.
             */

            await transaction.CommitAsync();

            return ExpenseDeleteResult.Deleted;
        }
        catch
        {
            await transaction.RollbackAsync();

            throw;
        }
    }

    /// <summary>
    /// Returns true only when an itinerary request represents
    /// a paid activity.
    /// </summary>
    private static bool HasPositiveCost(
        TripItineraryItemRequestBase request
    )
    {
        return
            request.Cost.HasValue &&
            request.Cost.Value > 0;
    }

    /// <summary>
    /// Ensures that every paid activity has a currency.
    /// </summary>
    private static void EnsureCurrencyForPaidActivity(
        TripItineraryItemRequestBase request
    )
    {
        if (
            !HasPositiveCost(request) ||
            !string.IsNullOrWhiteSpace(
                request.Currency
            )
        )
        {
            return;
        }

        throw new ArgumentException(
            "Currency is required when cost is greater than zero.",
            nameof(request.Currency)
        );
    }

    /// <summary>
    /// Creates an expense from a paid itinerary activity.
    /// </summary>
    private static CreateTripExpenseRequest
        CreateExpenseRequest(
            TripItineraryItemRequestBase request
        )
    {
        return new CreateTripExpenseRequest
        {
            Category =
                request.Category,

            Title =
                request.Title,

            Amount =
                request.Cost!.Value,

            Currency =
                request.Currency!,

            ReferenceUrl =
                request.ReferenceUrl,

            Notes =
                request.Description
        };
    }

    /// <summary>
    /// Converts the combined expense creation request into the
    /// regular expense request used by the expense DAL.
    ///
    /// Itinerary scheduling deliberately stays outside the
    /// expense model.
    /// </summary>
    private static CreateTripExpenseRequest
        CreateStandaloneExpenseRequest(
            CreateTripExpenseWithItineraryRequest request
        )
    {
        return new CreateTripExpenseRequest
        {
            Category =
                request.Category,

            Title =
                request.Title,

            Amount =
                request.Amount,

            Currency =
                request.Currency,

            ReferenceUrl =
                request.ReferenceUrl,

            Notes =
                request.Notes
        };
    }

    /// <summary>
    /// Creates a linked itinerary activity from an expense.
    ///
    /// Shared content comes from the expense while scheduling
    /// comes exclusively from the nested itinerary object.
    /// </summary>
    private static CreateTripItineraryItemRequest
        CreateItineraryRequestFromExpense(
            CreateTripExpenseWithItineraryRequest request
        )
    {
        var itinerary =
            request.Itinerary
            ?? throw new InvalidOperationException(
                "Itinerary information is required."
            );

        return new CreateTripItineraryItemRequest
        {
            Title =
                request.Title,

            Category =
                request.Category,

            Description =
                request.Notes,

            ReferenceUrl =
                request.ReferenceUrl,

            Cost =
                request.Amount,

            Currency =
                request.Currency,

            ItineraryDate =
                itinerary.ItineraryDate,

            StartTime =
                itinerary.StartTime,

            EndTime =
                itinerary.EndTime
        };
    }

    /// <summary>
    /// Creates an expense update from a paid itinerary activity.
    /// </summary>
    private static UpdateTripExpenseRequest
        CreateUpdateExpenseRequest(
            TripItineraryItemRequestBase request
        )
    {
        return new UpdateTripExpenseRequest
        {
            Category =
                request.Category,

            Title =
                request.Title,

            Amount =
                request.Cost!.Value,

            Currency =
                request.Currency!,

            ReferenceUrl =
                request.ReferenceUrl,

            Notes =
                request.Description
        };
    }

    /// <summary>
    /// Creates an itinerary update from an expense edit while
    /// preserving all existing scheduling information.
    /// </summary>
    private static UpdateTripItineraryItemRequest
        CreateItineraryUpdateRequestFromExpense(
            UpdateTripExpenseRequest expenseRequest,
            TripItineraryItem currentItem
        )
    {
        return new UpdateTripItineraryItemRequest
        {
            Title =
                expenseRequest.Title,

            Category =
                expenseRequest.Category,

            Description =
                expenseRequest.Notes,

            ReferenceUrl =
                expenseRequest.ReferenceUrl,

            Cost =
                expenseRequest.Amount,

            Currency =
                expenseRequest.Currency,

            ItineraryDate =
                currentItem.ItineraryDate,

            StartTime =
                currentItem.StartTime,

            EndTime =
                currentItem.EndTime
        };
    }

    /// <summary>
    /// Reads the database connection string used for shared
    /// itinerary-expense transactions.
    /// </summary>
    private string GetConnectionString()
    {
        var connectionString =
            _configuration.GetConnectionString(
                "DefaultConnection"
            );

        if (
            string.IsNullOrWhiteSpace(
                connectionString
            )
        )
        {
            throw new InvalidOperationException(
                "Missing database connection string."
            );
        }

        return connectionString;
    }

    /// <summary>
    /// Maps an itinerary item into its API response, including
    /// linked expense cost and currency when applicable.
    /// </summary>
    private static TripItineraryItemResponse
        MapItineraryResponse(
            TripItineraryItem item,
            decimal? cost,
            string? currency
        )
    {
        return new TripItineraryItemResponse
        {
            Id =
                item.Id,

            TripId =
                item.TripId,

            ExpenseId =
                item.ExpenseId,

            Title =
                item.Title,

            Description =
                item.Description,

            Category =
                item.Category,

            ItineraryDate =
                item.ItineraryDate,

            StartTime =
                item.StartTime,

            EndTime =
                item.EndTime,

            ReferenceUrl =
                item.ReferenceUrl,

            Cost =
                cost,

            Currency =
                currency,

            CreatedAt =
                item.CreatedAt,

            UpdatedAt =
                item.UpdatedAt
        };
    }

    /// <summary>
    /// Maps an expense into its API response, including linked
    /// itinerary scheduling information when applicable.
    /// </summary>
    private static TripExpenseResponse
        MapExpenseResponse(
            TripExpense expense,
            TripItineraryItem? itineraryItem
        )
    {
        return new TripExpenseResponse
        {
            Id =
                expense.Id,

            TripId =
                expense.TripId,

            Category =
                expense.Category,

            Title =
                expense.Title,

            Amount =
                expense.Amount,

            Currency =
                expense.Currency,

            ReferenceUrl =
                expense.ReferenceUrl,

            Notes =
                expense.Notes,

            ItineraryItemId =
                itineraryItem?.Id,

            ItineraryDate =
                itineraryItem?.ItineraryDate,

            StartTime =
                itineraryItem?.StartTime,

            EndTime =
                itineraryItem?.EndTime,

            CreatedAt =
                expense.CreatedAt,

            UpdatedAt =
                expense.UpdatedAt
        };
    }
}