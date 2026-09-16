/**
 * Anciennes URLs de vente de scrapers sur le blog.
 * Les scripts sont désormais sur Datareacher.
 */
export default function MarketplaceToolRedirect() {
  return null
}

export async function getServerSideProps() {
  return {
    redirect: {
      destination: 'https://datareacher.fr',
      permanent: true,
    },
  }
}
