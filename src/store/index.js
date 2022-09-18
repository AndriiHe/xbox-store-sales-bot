const httpClient = require('../httpClient');
const { from, zip, of } = require('rxjs');
const { mergeMap, map, reduce, retry } = require('rxjs/operators');

const PER_PAGE = 200;
const PURCHASE_ACTION = 'Purchase';
const BROWSE_ACTION = 'Browse';
const LANGUAGE = 'en-us';
const NON_GAMEPASS_PRODUCTS_SOURCE = 'https://reco-public.rec.mp.microsoft.com/channels/Reco/V8.0/Lists/Computed';
const GAMEPASS_PRODUCTS_SOURCE = 'https://catalog.gamepass.com/sigls/v2';
const PRODUCTS_DETAILS_SOURCE = 'https://displaycatalog.mp.microsoft.com/v7.0/products';

const gamePassCategories = [
  'f6f1f99f-9b49-4ccd-b3bf-4d9767a77f5e', // EA Play Game Pass
  'b8900d09-a491-44cc-916e-32b5acae621b', // Xbox Game Pass Console
  'a884932a-f02b-40c8-a903-a008c23b1df1', // EA Play Game Pass
  '79fe89cf-f6a3-48d4-af6c-de4482cf4a51', // PC Game Pass
  '1d33fbb9-b895-4732-a8ca-a55c8b99fa2c', // All games
  '609d944c-d395-4c0a-9ea4-e9f39b52c1ad', // Most popular
  '29a81209-df6f-41fd-a528-2ae6b91f719c', // Bethesda Softworks
];

const generalCategories = [
  'TopPaid',
  'New',
  'BestRated',
  'ComingSoon',
  'Deal',
  'TopFree',
  'MostPlayed',
];

const getNonGamePassProductsRequest = (category, page, perPage, market) => `${NON_GAMEPASS_PRODUCTS_SOURCE}/${ category }?Market=${market}&Language=${LANGUAGE}&ItemTypes=Game&deviceFamily=Windows.Xbox&count=${perPage}&skipitems=${page * perPage || 0}`

const getGamePassProductsRequest = (category, market) => `${GAMEPASS_PRODUCTS_SOURCE}?id=${category}&market=${market}&language=${LANGUAGE}`

const getProductsDetailsRequest = (ids, market) => `${PRODUCTS_DETAILS_SOURCE}?bigIds=${ids.join(',')}&market=${market}&languages=${LANGUAGE}`;

const getPages = (totalItems, perPage) => Array(Math.ceil(totalItems / perPage)).fill(0).map((_, page) => page);

const chunk = (data, size) => Array(Math.ceil(data.length / size)).fill(0).map((_, i) => data.slice(i * size, i * size + size));

const getNonGamePassProducts = (market) => from(generalCategories).pipe(
  // Fetch products by category
  mergeMap(category => of(category).pipe(
    // Fetch category total products
    map(category => getNonGamePassProductsRequest(category, 0, 1, market)),
    mergeMap(url => httpClient.get(url)),
    // Paginate category products
    mergeMap(({ response }) => from(getPages(response.body.PagingInfo.TotalItems, PER_PAGE))),
    // Fetch paginated category products
    map(page => getNonGamePassProductsRequest(category, page, PER_PAGE, market)),
    mergeMap(url => httpClient.get(url)),
  )),
  // Aggregate category products to single list
  map(({ response }) => response.body.Items.map(({ Id }) => Id)),
  reduce((products, ids) => [ ...products, ...ids ], []),
)

const getGamePassProducts = (market) => from(gamePassCategories).pipe(
  // Fetch products by category
  map(category => getGamePassProductsRequest(category, market)),
  mergeMap(url => httpClient.get(url)),
  // Aggregate category products to single list
  map(({ response }) => response.body.map(({ id }) => id).filter(id => id)),
  reduce((products, ids) => [ ...products, ...ids ], []),
);

const getPrices = (product) => {
  const prices = getAvailabilities(product).map(availability => ({
    ...availability.OrderManagementData.Price,
    platforms: availability.Conditions.ClientConditions.AllowedPlatforms,
    requiredProductId: availability.Remediations?.pop()?.BigId,
  }));

  return prices
    .sort((a, b) => a.ListPrice > b.ListPrice ? -1 : a.ListPrice < b.ListPrice ? 1 : 0)
    .filter((price, index) => prices.findIndex(p => p.requiredProductId === price.requiredProductId) === index);
}

const getProductsDetails = (ids, market) => from(chunk(ids, PER_PAGE)).pipe(
  map(items => getProductsDetailsRequest(items, market)),
  mergeMap(url => httpClient.get(url).pipe(retry(2))),
  map(({ response }) => response.body.Products?.filter(product => isAvailableToPurchase(product)) || []),
  map(products => products.map(product => {
    const poster = product.LocalizedProperties.find(i => i.Images)?.Images?.find(image => image.ImagePurpose === 'Poster')?.Uri;
    const prices = getPrices(product);
    return {
      id: product.ProductId,
      name: product.LocalizedProperties.find(i => i.ProductTitle)?.ProductTitle,
      prices: prices.reduce((prices, price) => [
        ...prices,
        ...price.platforms.map(platform => ({
          price: { [market]: price.ListPrice || 0 },
          recommendedPrice: { [market]: price.MSRP },
          requiredProductId: price.requiredProductId || '',
          platform: platform.PlatformName,
        }))
      ], []),
      description: product.LocalizedProperties.find(i => i.ProductDescription)?.ProductDescription,
      image: poster && !poster.startsWith('http') ? `https:${poster}` : poster,
      categories: product.Properties?.Categories || product.Properties?.Category ? [product.Properties.Category] : [],
    };
  })),
  reduce((products, ids) => [ ...products, ...ids ], []),
);

const getProducts = (market) => zip(getGamePassProducts(market), getNonGamePassProducts(market)).pipe(
  map(([ gamePassProducts, nonGamePassProducts ]) => [ ...gamePassProducts, ...nonGamePassProducts ]),
  map((ids) => ids.filter((id, index) => ids.indexOf(id) === index)),
);

const getAvailabilities = ({ DisplaySkuAvailabilities }) => DisplaySkuAvailabilities
  .reduce((availabilities, i) => [ ...availabilities, ...i.Availabilities ], [])
  .filter(i => [ BROWSE_ACTION, PURCHASE_ACTION ].every(action => i.Actions.includes(action)));

const isAvailableToPurchase = product => !!getAvailabilities(product).pop();

module.exports = { getProducts, getProductsDetails };
