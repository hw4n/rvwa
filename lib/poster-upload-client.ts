type PosterUploadPreparation = {
  uploadUrl?: string;
  publicUrl?: string;
  message?: string;
};

async function readPreparation(response: Response) {
  return (await response.json().catch(() => null)) as PosterUploadPreparation | null;
}

export async function uploadPosterFile(file: File) {
  let preparationResponse: Response;

  try {
    preparationResponse = await fetch("/api/posters/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      }),
    });
  } catch {
    throw new Error("업로드 서버에 연결할 수 없습니다.");
  }

  const preparation = await readPreparation(preparationResponse);

  if (!preparationResponse.ok) {
    const message = preparation?.message ?? "업로드 준비에 실패했습니다.";
    throw new Error(`${message} (HTTP ${preparationResponse.status})`);
  }

  if (!preparation?.uploadUrl || !preparation.publicUrl) {
    throw new Error(
      `업로드 서버가 올바르지 않은 응답을 반환했습니다. (HTTP ${preparationResponse.status})`
    );
  }

  let uploadResponse: Response;

  try {
    uploadResponse = await fetch(preparation.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });
  } catch {
    throw new Error("이미지 저장소에 연결할 수 없습니다. 저장소 CORS 설정을 확인해주세요.");
  }

  if (!uploadResponse.ok) {
    throw new Error(`이미지 업로드에 실패했습니다. (HTTP ${uploadResponse.status})`);
  }

  return preparation.publicUrl;
}
