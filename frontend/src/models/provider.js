// Whitelist public card fields; never spread account data into a provider card.
export function toProvider(type, record) {
  const common = {
    id: record.id,
    key: `${type}:${record.id}`,
    type,
    city: record.city,
    province: record.province,
  };
  if (type === 'business') {
    return { ...common, name: record.name, category: record.category,
      description: record.description, address: record.address, latitude: record.latitude, longitude: record.longitude, coverImageUrl: record.coverImageUrl,
      averageRating: record.averageRating, reviewCount: record.reviewCount };
  }
  return { ...common, displayName: record.displayName, profileImageUrl: record.profileImageUrl, headline: record.headline,
    bio: record.bio, skills: record.skills || [], serviceCategories: record.serviceCategories || [] };
}
