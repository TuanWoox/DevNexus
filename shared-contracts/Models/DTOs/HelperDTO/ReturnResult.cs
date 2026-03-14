namespace shared_contracts.Models.DTOs.HelperDTO
{
    public class ReturnResult<T>
    {
        public T Result { get; set; }
        public string Message { get; set; }

    }
    public class ReturnSearchResult<T> : ReturnResult<T>
    {
        public int Total { get; set; }
    }
}
