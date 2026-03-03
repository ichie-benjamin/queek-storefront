import { useVendorStore } from '../stores/vendorStore';

export const VendorMeta = () => {
  const profile = useVendorStore((s) => s.profile);

  if (!profile?.name) return null;

  const title = profile.tagline
    ? `${profile.name} | ${profile.tagline}`
    : profile.name;

  const description = profile.tagline
    ?? `Order from ${profile.name}. Fast delivery, secure payments — powered by Queek.`;

  const image = profile.logo ?? '/logo/queek.png';

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <link rel="icon" href={image} />
    </>
  );
};
