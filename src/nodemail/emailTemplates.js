export const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác thực địa chỉ Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #003366; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Cổng thông tin Tuyển sinh HaUI</h1>
  </div>
  <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
    <h2 style="color: #003366; text-align: center;">Xác thực Email của bạn</h2>
    <p>Xin chào,</p>
    <p>Cảm ơn bạn đã đăng ký tài khoản! Vui lòng sử dụng mã xác thực dưới đây để hoàn tất quá trình đăng ký:</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="background-color: #FFFBEB; border: 1px solid #FDB813; border-radius: 8px; padding: 15px 20px; display: inline-block;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #003366;">{verificationCode}</span>
      </div>
    </div>
    <p>Vì lý do bảo mật, mã này sẽ hết hạn sau <strong>15 phút</strong>.</p>
    <p>Nếu bạn không phải là người tạo tài khoản này, vui lòng bỏ qua email này.</p>
    <p>Trân trọng,<br>Đội ngũ Cổng thông tin Tuyển sinh HaUI</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
    <p>Đây là email tự động, vui lòng không trả lời email này.</p>
    <p>&copy; ${new Date().getFullYear()} Đại học Công nghiệp Hà Nội</p>
  </div>
</body>
</html>
`;

export const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đặt lại mật khẩu thành công</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #003366; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Cổng thông tin Tuyển sinh HaUI</h1>
  </div>
  <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
    <h2 style="color: #003366; text-align: center;">Đặt lại mật khẩu thành công</h2>
    <p>Xin chào,</p>
    <p>Chúng tôi gửi email này để xác nhận rằng mật khẩu cho tài khoản của bạn đã được đặt lại thành công.</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="background-color: #003366; color: white; width: 60px; height: 60px; line-height: 60px; border-radius: 50%; display: inline-block; font-size: 36px;">
        &#10003;
      </div>
    </div>
    <p>Nếu bạn không phải là người thực hiện yêu cầu này, vui lòng liên hệ với đội ngũ hỗ trợ của chúng tôi ngay lập tức.</p>
    <p>Để giữ an toàn cho tài khoản, chúng tôi khuyến nghị bạn:</p>
    <ul style="padding-left: 20px;">
      <li>Sử dụng mật khẩu mạnh và không trùng lặp.</li>
      <li>Bật xác thực hai yếu tố (nếu có).</li>
      <li>Tránh sử dụng cùng một mật khẩu cho nhiều trang web khác nhau.</li>
    </ul>
    <p>Trân trọng,<br>Đội ngũ Cổng thông tin Tuyển sinh HaUI</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
    <p>Đây là email tự động, vui lòng không trả lời email này.</p>
    <p>&copy; ${new Date().getFullYear()} Đại học Công nghiệp Hà Nội</p>
  </div>
</body>
</html>
`;

export const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yêu cầu đặt lại mật khẩu</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #003366; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Cổng thông tin Tuyển sinh HaUI</h1>
  </div>
  <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
    <h2 style="color: #003366; text-align: center;">Yêu cầu đặt lại mật khẩu</h2>
    <p>Xin chào,</p>
    <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
    <p>Để tiếp tục quá trình đặt lại mật khẩu, vui lòng nhấp vào nút bên dưới:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{resetURL}" style="background-color: #003366; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Đặt lại mật khẩu</a>
    </div>
    <p>Vì lý do bảo mật, liên kết này sẽ hết hạn sau <strong>1 giờ</strong>.</p>
    <p>Trân trọng,<br>Đội ngũ Cổng thông tin Tuyển sinh HaUI</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
    <p>Đây là email tự động, vui lòng không trả lời email này.</p>
    <p>&copy; ${new Date().getFullYear()} Đại học Công nghiệp Hà Nội</p>
  </div>
</body>
</html>
`;

export const CONSULTATION_REQUEST_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Yêu cầu tư vấn đã được gửi thành công</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #003366; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Cổng thông tin Tuyển sinh HaUI</h1>
  </div>
  <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
    <h2 style="color: #003366; text-align: center;">🎉 Yêu cầu tư vấn đã được gửi thành công!</h2>
    <p>Chào <strong>{fullName}</strong>,</p>
    <p>
      Cảm ơn bạn đã quan tâm đến chương trình tuyển sinh của trường. Yêu cầu tư vấn của bạn đã được ghi nhận. 
      Đội ngũ tư vấn của Đại học Công nghiệp Hà Nội sẽ liên hệ với bạn trong thời gian sớm nhất qua số điện thoại <strong>{phoneNumber}</strong> hoặc email <strong>{email}</strong>.
    </p>

    <div style="text-align: center; margin-top: 30px;">
        <a href="{homeURL}" style="background-color: #FDB813; color: #003366; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Quay lại trang chủ</a>
    </div>

  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
    <p>Đây là email tự động, vui lòng không trả lời email này.</p>
    <p>&copy; ${new Date().getFullYear()} Đại học Công nghiệp Hà Nội</p>
  </div>
</body>
</html>
`;

export const CONSULTATION_REQUEST_ADVISOR_TEMPLATE = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Có Yêu Cầu Tư Vấn Mới</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
  <div style="background-color: #003366; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Cổng thông tin Tuyển sinh HaUI</h1>
  </div>
  <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
    <h2 style="color: #003366; text-align: center;">🔔 Thông Báo: Có Yêu Cầu Tư Vấn Mới!</h2>
    <p>Chào bạn,</p>
    <p>
      Một sinh viên mới đã gửi yêu cầu tư vấn về chuyên ngành mà bạn đang phụ trách. Vui lòng xem thông tin chi tiết dưới đây để liên hệ và hỗ trợ sinh viên:
    </p>
    <ul style="list-style: none; padding: 0; margin: 20px 0;">
      <li style="margin-bottom: 10px;"><strong>Họ và tên:</strong> {fullName}</li>
      <li style="margin-bottom: 10px;"><strong>Email:</strong> {email}</li>
      <li style="margin-bottom: 10px;"><strong>Số điện thoại:</strong> {phoneNumber}</li>
      <li style="margin-bottom: 10px;"><strong>Chuyên ngành quan tâm:</strong> {majorName}</li>
    </ul>
    <p>
      Hãy liên hệ với sinh viên sớm nhất để hỗ trợ kịp thời.
    </p>
    <p>
      Trân trọng,<br>Đội ngũ Cổng thông tin Tuyển sinh HaUI
    </p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
    <p>Đây là email tự động, vui lòng không trả lời email này.</p>
    <p>&copy; ${new Date().getFullYear()} Đại học Công nghiệp Hà Nội</p>
  </div>
</body>
</html>
`;
