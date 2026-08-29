namespace Backend.Services;

public enum ExpenseDeleteResult
{
    Deleted,
    NotFound,
    LinkedActivityChoiceRequired
}