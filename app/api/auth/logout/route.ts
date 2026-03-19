export async function POST() {
    const response = Response.json(
      { message: "تم تسجيل الخروج" },
      { status: 200 }
    );
  
    response.headers.set(
      "Set-Cookie",
      "token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict"
    );
  
    return response;
  }