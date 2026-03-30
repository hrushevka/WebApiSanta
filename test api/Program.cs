using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity.Data;
using test_api.Controllers;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddSingleton<UsersController>();

var app = builder.Build();

app.UseCors("AllowAll");
app.UseDefaultFiles();
app.UseStaticFiles();

// POST /api/santa/register
app.MapPost("/api/santa/register", (RegisterRequest request, UsersController cont) =>
{
    try
    {
        var (userName, giftFor) = cont.RegisterUser(request.Name);
        return Results.Ok(new RegisterResponse(userName, giftFor));
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
    catch (InvalidOperationException ex)
    {
        return Results.Conflict(new { error = ex.Message });
    }
});

// POST /api/santa/wish
app.MapPost("/api/santa/wish", (WishRequest request, UsersController cont) =>
{
    try
    {
        cont.SaveWish(request.Name, request.Wish);
        return Results.Ok(new { status = "wish saved" });
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
    catch (KeyNotFoundException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

// GET /api/santa/wish/{name}
app.MapGet("/api/santa/wish/{name}", (string name, UsersController cont) =>
{
    try
    {
        var (userName, wish) = cont.GetWish(name);
        return Results.Ok(new WishResponse(userName, wish));
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
    catch (KeyNotFoundException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
});

app.Run();

public class RegisterRequest
{
    public string Name { get; set; } = string.Empty;
}

public class RegisterResponse
{
    public string UserName { get; set; } = string.Empty;
    public string GiftFor { get; set; } = string.Empty;

    public RegisterResponse() { }

    public RegisterResponse(string userName, string giftFor)
    {
        UserName = userName;
        GiftFor = giftFor;
    }
}

public class WishRequest
{
    public string Name { get; set; } = string.Empty;
    public string Wish { get; set; } = string.Empty;
}

public class WishResponse
{
    public string Name { get; set; } = string.Empty;
    public string Wish { get; set; } = string.Empty;

    public WishResponse() { }

    public WishResponse(string name, string wish)
    {
        Name = name;
        Wish = wish;
    }
}