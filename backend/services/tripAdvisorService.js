const axios = require('axios');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'tripadvisor16.p.rapidapi.com';

const searchHotels = async (city, checkIn, checkOut) => {
    try {
        console.log(`TripAdvisor16 Search for: ${city}`);
        if (!RAPIDAPI_KEY) {
            console.error('RAPIDAPI_KEY is missing');
            return [];
        }

        // 1. Search Location to get GeoId
        const locationOptions = {
            method: 'GET',
            url: `https://${RAPIDAPI_HOST}/api/v1/hotels/searchLocation`,
            params: { query: city },
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST
            }
        };

        const locationRes = await axios.request(locationOptions);
        // console.log('Location Response:', JSON.stringify(locationRes.data.data?.[0] || 'No Data'));

        if (!locationRes.data.data || locationRes.data.data.length === 0) {
            console.log('Location not found');
            return [];
        }

        // Extract GeoId from the first result
        const firstResult = locationRes.data.data[0];
        const geoId = firstResult.geoId;
        const locationName = firstResult.title || firstResult.name || city;

        if (!geoId) {
            console.log('GeoId not found for location');
            return [];
        }

        console.log(`Found GeoId: ${geoId} for ${locationName}`);

        // Default dates if missing (tomorrow and day after)
        let finalCheckIn = checkIn;
        let finalCheckOut = checkOut;

        if (!finalCheckIn || !finalCheckOut) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dayAfter = new Date(tomorrow);
            dayAfter.setDate(dayAfter.getDate() + 1);

            finalCheckIn = tomorrow.toISOString().split('T')[0];
            finalCheckOut = dayAfter.toISOString().split('T')[0];
        }

        console.log(`Searching Hotels with: GeoId=${geoId}, CheckIn=${finalCheckIn}, CheckOut=${finalCheckOut}`);

        // 2. Search Hotels by GeoId
        const hotelOptions = {
            method: 'GET',
            url: `https://${RAPIDAPI_HOST}/api/v1/hotels/searchHotels`,
            params: {
                geoId: geoId,
                checkIn: finalCheckIn,
                checkOut: finalCheckOut,
                pageNumber: '1',
                currencyCode: 'INR'
            },
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST
            }
        };

        const hotelRes = await axios.request(hotelOptions);

        // Log structure to help debug
        console.log('Hotel Response Data:', JSON.stringify(hotelRes.data).substring(0, 1000)); // Log first 1000 chars
        // Check for the "data" array in the response
        const hotelsData = hotelRes.data.data?.data || [];

        const hotels = hotelsData.map((item, index) => {
            // Price can be null, check priceDetails or just leave as null to show "View Deal"
            let priceVal = 0;
            if (item.priceForDisplay) {
                // Remove non-numeric chars except dot/comma if needed, usually simplified to int
                priceVal = parseInt(item.priceForDisplay.replace(/[^0-9]/g, '')) || 0;
            }

            // Fix Image URL: Replace {width}, {height}, {mode} globally
            // URL might look like: .../image.jpg?w={width}&h={height}&s={mode}
            // or just ...?w={width}&h={height}
            let imageUrl = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?fit=crop&w=800&q=80';
            if (item.cardPhotos?.[0]?.sizes?.urlTemplate) {
                imageUrl = item.cardPhotos[0].sizes.urlTemplate
                    .replace(/\{width\}/g, '500')
                    .replace(/\{height\}/g, '300')
                    .replace(/\{mode\}/g, '1') // Some URLs might use {mode}
                    .replace('?w={width}&h={height}&s={mode}', '?w=500&h=300&s=1'); // fallback exact match
            }

            // Sanitize Location: Remove HTML tags like <b>Mumbai</b>
            const rawLocation = item.secondaryInfo || locationName;
            const location = rawLocation.replace(/<[^>]*>?/gm, '');

            return {
                id: item.id || `ta_${index}`,
                name: item.title || item.name,
                location: location,
                primaryInfo: item.primaryInfo || null,
                rating: item.bubbleRating?.rating || 0,
                reviews: item.bubbleRating?.count || '0',
                price: priceVal,
                priceDisplay: item.priceForDisplay || null,
                image: imageUrl,
                amenities: [],
                isSponsored: item.isSponsored || false,
                provider: item.provider || 'TripAdvisor',
                link: `https://www.tripadvisor.com${item.cardLink?.route?.url}` || '#'
            };
        });

        console.log(`Found ${hotels.length} hotels via TripAdvisor16 (GeoId: ${geoId})`);
        return hotels;

    } catch (error) {
        console.error('TripAdvisor16 API Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
        return [];
    }
};

const getHotelDetails = async (hotelId, checkIn, checkOut, adults, rooms) => {
    try {
        if (!RAPIDAPI_KEY) throw new Error('RAPIDAPI_KEY is missing');
        console.log(`Fetching details for hotelId: ${hotelId}`);

        if (!checkIn || !checkOut) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            checkIn = tomorrow.toISOString().split('T')[0];

            const nextDay = new Date(tomorrow);
            nextDay.setDate(tomorrow.getDate() + 1);
            checkOut = nextDay.toISOString().split('T')[0];

            console.log(`Using default dates for details: ${checkIn} to ${checkOut}`);
        }

        const options = {
            method: 'GET',
            url: `https://${RAPIDAPI_HOST}/api/v1/hotels/getHotelDetails`,
            params: {
                id: hotelId,
                checkIn: checkIn,
                checkOut: checkOut,
                adults: adults || '2',
                rooms: rooms || '1',
                currencyCode: 'INR'
            },
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST
            }
        };

        const response = await axios.request(options);
        const data = response.data?.data;

        if (!data) return null;

        // Helper to fix image templates
        const fixImg = (url) => url ? url.replace('{width}', '800').replace('{height}', '500') : null;

        return {
            title: data.title,
            rating: data.rating,
            ratingCount: data.numberReviews,
            ranking: data.rankingDetails?.replace(/<[^>]*>?/gm, '') || '',
            price: data.price?.displayPrice || 'Check dates',
            photos: data.photos?.map(p => fixImg(p.urlTemplate)).filter(Boolean) || [],
            about: data.about?.content?.[0]?.content?.[0]?.content || data.about?.title, // fallback logic
            amenities: data.amenitiesScreen?.map(grp => ({
                title: grp.title,
                items: grp.content
            })) || [],
            address: data.location?.address,
            reviews: data.reviews?.content?.map(r => ({
                title: r.title,
                text: r.text?.replace(/<br \/>/g, '\n'),
                user: r.userProfile?.displayName,
                rating: r.rating,
                date: r.publishedDate
            })) || [],
            location: data.location
        };

    } catch (error) {
        console.error('Error fetching hotel details:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
};

module.exports = { searchHotels, getHotelDetails };
