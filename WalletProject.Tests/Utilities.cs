using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace WalletProject.Tests
{
    public static class Utilities
    {
        public static StringContent GetStringContent(object obj)
        {
            return new StringContent(
                JsonSerializer.Serialize(obj),
                Encoding.UTF8,
                "application/json"
            );
        }

        public static async Task<T> GetDeserializedContent<T>(HttpResponseMessage response)
        {
            var stringResponse = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<T>(
                stringResponse,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );
            return result
                ?? throw new InvalidOperationException("Failed to deserialize response content");
        }
    }
}
