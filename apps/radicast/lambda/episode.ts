export type Episode = {
  station: string;
  title?: string;
  url?: string;
  startedAt: Date;
  size: number;
  lastModified: Date;
  localPath: string;
};

export const Episode = {
  from({
    station,
    url,
    startedAt,
    size,
    lastModified,
    localPath,
  }: {
    station: string;
    url?: string;
    startedAt: Date;
    size: number;
    lastModified: Date;
    localPath: string;
  }): Episode {
    return {
      station,
      title: url?.split("/").pop(),
      url,
      startedAt,
      size,
      lastModified,
      localPath,
    };
  },
};
