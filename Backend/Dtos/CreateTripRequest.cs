namespace Backend.Dtos;

public class CreateTripRequest : TripRequestBase
{
    public Guid UserId { get; set; }
}