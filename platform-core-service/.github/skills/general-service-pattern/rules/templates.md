# Templates

## Generic Controller Template

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ResourceController : ControllerBase
{
    private readonly IResourceService _resourceService;

    public ResourceController(IResourceService resourceService)
    {
        _resourceService = resourceService;
    }

    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] CreateResourceDTO dto)
    {
        ReturnResult<ResourceDTO> returnResult = new ReturnResult<ResourceDTO>();
        try
        {
            returnResult = await _resourceService.CreateAsync(dto);
        }
        catch (Exception ex)
        {
            AppLogger.Instance.Debug(ex.Message);
            returnResult.Message = $"An error occurred: {ex.Message}";
        }
        return Ok(returnResult);
    }
}
```

## Generic Service Method Template

```csharp
public async Task<ReturnResult<ResourceDTO>> UpdateAsync(UpdateResourceDTO updateDTO)
{
    ReturnResult<ResourceDTO> returnResult = new ReturnResult<ResourceDTO>();
    try
    {
        // Step 1: Validate ID
        if (string.IsNullOrEmpty(updateDTO.Id))
        {
            returnResult.Message = "Invalid resource ID";
            return returnResult;
        }

        // Step 2: Validate auth
        if (string.IsNullOrEmpty(_userContext.UserId))
        {
            returnResult.Message = "User not authenticated";
            return returnResult;
        }

        // Step 3: Load current entity
        var getResult = await _resourceRepository.GetByIdAsync(updateDTO.Id);
        if (getResult.Result == null)
        {
            returnResult.Message = $"Resource {updateDTO.Id} not found";
            return returnResult;
        }

        // Step 4: Ownership check when applicable
        if (getResult.Result.OwnerId != _userContext.UserId)
        {
            returnResult.Message = "Access denied: You do not own this resource";
            return returnResult;
        }

        // Step 5: Perform update
        var result = await _resourceRepository.UpdateAsync<UpdateResourceDTO>(updateDTO);
        if (result.Result != null)
        {
            returnResult.Result = _mapper.Map<ResourceDTO>(result.Result);
        }
        else
        {
            returnResult.Message = result.Message;
        }
    }
    catch (Exception ex)
    {
        AppLogger.Instance.Debug(ex.Message);
        returnResult.Message = $"An error occurred while updating resource: {ex.Message}";
    }
    return returnResult;
}
```

## Bulk Delete Pattern (Required)

Repository delete-many typically deletes by ID list only.
Because ownership is not enforced in repository, the service must validate ownership first.

```csharp
public async Task<ReturnResult<int>> DeleteManyAsync(List<string> ids)
{
    ReturnResult<int> returnResult = new ReturnResult<int>();
    try
    {
        if (ids == null || ids.Count == 0)
        {
            returnResult.Message = "Invalid resource IDs";
            return returnResult;
        }

        if (string.IsNullOrEmpty(_userContext.UserId))
        {
            returnResult.Message = "User not authenticated";
            return returnResult;
        }

        var ownedCount = await _dbContext.Resources
            .Where(x => ids.Contains(x.Id) && x.OwnerId == _userContext.UserId)
            .CountAsync();

        if (ownedCount != ids.Count)
        {
            returnResult.Message = "Access denied: You do not own all requested resources";
            return returnResult;
        }

        var result = await _resourceRepository.DeleteByIdsAsync(ids);
        returnResult.Result = result.Result;

        if (result.Result == 0)
        {
            returnResult.Message = result.Message;
        }
    }
    catch (Exception ex)
    {
        AppLogger.Instance.Debug(ex.Message);
        returnResult.Message = $"An error occurred while deleting resources: {ex.Message}";
    }
    return returnResult;
}
```
