import Image from 'next/image';

const PlatformLogo = ({ platform }) => {
  const logos = {
    fiverr: (
      <Image 
        src="https://static.vecteezy.com/system/resources/previews/025/732/716/non_2x/fiverr-logo-icon-online-platform-for-freelancers-free-vector.jpg" 
        alt="Fiverr Logo" 
        width={24} 
        height={24} 
        className="w-6 h-6 object-contain rounded-full"
      />
    ),
    malt: (
      <Image 
        src="https://yt3.googleusercontent.com/FfrPR_xsbBbmaDl1nQEJiqDEPRUPEFrBBC3FRoKGbr3jqJP0L2hStNPiHCdbdNQFwRspubiTzA=s900-c-k-c0x00ffffff-no-rj" 
        alt="Malt Logo" 
        width={24} 
        height={24} 
        className="w-6 h-6 object-contain rounded-full"
      />
    ),
    comeup: (
      <Image 
        src="https://yt3.googleusercontent.com/XqAkyLsOBvu_qjxLdnUmwP1N-d-HHW6ulR4beUb3A8KndOxraUzoExzZPj_4-g6-b09oVREqWw=s900-c-k-c0x00ffffff-no-rj" 
        alt="Comeup Logo" 
        width={24} 
        height={24} 
        className="w-6 h-6 object-contain rounded-full"
      />
    ),
    linkedin: (
      <Image 
        src="https://cdn-icons-png.freepik.com/256/2496/2496097.png?semt=ais_hybrid" 
        alt="LinkedIn Logo" 
        width={24} 
        height={24} 
        className="w-6 h-6 object-contain rounded-full"
      />
    )
  };

  return (
    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400">
      {logos[platform.toLowerCase()]}
    </div>
  );
};

export default PlatformLogo; 