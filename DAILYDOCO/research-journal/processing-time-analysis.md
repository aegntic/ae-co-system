# Processing Time Analysis - Test Audience Scaling

## ⏱️ OpenRouter Rate Limit Constraints

### Current Limits
- **Requests per minute**: 20
- **Requests per day**: 1000 (after $10 payment)
- **Batching capability**: 50 viewers per request

## 📊 Processing Time by Audience Size

| Audience Size | Requests Needed | Processing Time | Daily Test Capacity | Practicality |
|--------------|----------------|-----------------|--------------------| -------------|
| 1,000 | 20 | 1 minute | 50 tests/day | ✅ **EXCELLENT** |
| 10,000 | 200 | 10 minutes | 5 tests/day | ⚠️ **GOOD** (major launches) |
| 100,000 | 2,000 | 100 minutes | 0.5 tests/day | ❌ **IMPRACTICAL** |

## 🎯 Key Insights
- **1K audience**: Perfect for daily testing
- **10K audience**: Good for important launches
- **100K audience**: Overkill that creates bottlenecks

## 💡 Recommendation
**Optimal size appears to be 2,000-5,000 viewers** - balances statistical significance with practical processing constraints.