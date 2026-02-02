export const handlePdfExport = async (
  filters: any,
  aPresentarA: string,
  exportFunction: (params: any) => Promise<Blob>,
  fileName: string,
  setLoading: (loading: boolean) => void,
  onSuccess: () => void,
  onError: (message: string) => void,
) => {
  setLoading(true);
  try {
    const params = { ...filters, aPresentarA };
    const blob = await exportFunction(params);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    onSuccess();
  } catch (err) {
    console.error(err);
    onError("Error al descargar el PDF.");
  } finally {
    setLoading(false);
  }
};
