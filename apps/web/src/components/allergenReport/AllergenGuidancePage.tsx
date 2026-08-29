import { memo } from 'react';

interface AllergenGuidancePageProps {
  totalPages: number;
}

function AllergenGuidancePage({ totalPages }: AllergenGuidancePageProps) {
  return (
    <div 
      data-page="true"
      className="report-page w-[210mm] min-h-[297mm] max-w-[210mm] bg-white text-slate-900 p-8 mb-4 shadow-xl print:shadow-none print:mb-0 print:p-6 flex flex-col justify-between box-border"
      style={{ fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' }}
    >
      <div>
        {/* Tiêu đề trang lưu ý phòng ngừa */}
        <div className="text-center mb-5 pt-2">
          <h2 className="text-[20px] font-black text-red-700 uppercase tracking-wide">
            MỘT SỐ LƯU Ý VỀ PHÒNG NGỪA DỊ ỨNG
          </h2>
        </div>

        {/* Nội dung 5 điều hướng dẫn phòng ngừa */}
        <div className="text-[14px] text-slate-800 leading-relaxed space-y-3 text-justify">
          <p>
            <strong>1.</strong> Tìm nguyên nhân gây dị ứng hoặc dị ứng chéo bằng các xét nghiệm tìm dị nguyên. Nhiều trường hợp xét nghiệm dị nguyên vẫn không tìm ra nguyên nhân là do có nhiều dị nguyên hiện chưa được đưa vào xét nghiệm.
          </p>
          <p>
            <strong>2.</strong> Khi xét nghiệm không tìm thấy nguyên nhân dị ứng thì cần tiến hành cô lập từng yếu tố theo đường ăn uống (thực phẩm, đồ uống...), đường thở và tiếp xúc với môi trường (phấn hoa thường liên quan đến mùa, bụi, mạt, nấm, vi khuẩn... ở nhà, nơi công tác hay nơi di chuyển) để tìm nguyên nhân.
          </p>
          <div>
            <p>
              <strong>3.</strong> Mức độ dị ứng tỷ lệ thuận với số lần tiếp xúc với nguồn gây dị ứng, nhiều dị nguyên ngoài việc kích thích cơ thể gây dị ứng còn gây ra tình trạng phản ứng chéo với các loại khác làm tình trạng dị ứng thêm trầm trọng. Vì vậy, cần hạn chế tiếp xúc với nguồn có chứa hoặc nghi có chứa chất gây dị ứng bằng các biện pháp sau:
            </p>
            <div className="pl-4 pt-1.5 space-y-1 text-[13px] text-slate-700">
              <p><strong>a.</strong> Mặc áo kín, đeo khẩu trang, kính để tránh da tiếp xúc với các bụi và phấn hoa... khi làm vệ sinh trong nhà hay đi ngoài đường;</p>
              <p><strong>b.</strong> Không ăn các thức ăn, đồ uống đã từng hoặc nghi gây dị ứng đặc biệt là các thực phẩm có khả năng gây dị ứng cao như: động vật biển (tôm, cua...);</p>
              <p><strong>c.</strong> Thường xuyên vệ sinh cá nhân, giặt quần áo để hạn chế nguồn gây dị ứng tiếp xúc với các bộ phận của cơ thể;</p>
              <p><strong>d.</strong> Hạn chế vật nuôi trong nhà đối với những người có cơ địa dị ứng vì đó là nguồn dị ứng trực tiếp hoặc gây ra dị ứng chéo với các dị nguyên khác;</p>
              <p><strong>e.</strong> Thường xuyên vệ sinh cá nhân, nhà, nền nhà, các đồ vật trong nhà để chống bụi và loại bỏ các vi sinh vật tồn tại, phát triển. Nên sử dụng máy hút bụi thay cho việc quét hoặc lau nhà để hạn chế tiếp xúc với nguồn bụi;</p>
              <p><strong>f.</strong> Đóng cửa và hạn chế đi ra ngoài nếu ở vùng sinh sống có loài hoa, cỏ hoặc thực vật là nguồn gây dị ứng đặc biệt là mùa hoa nở các phấn hoa phát tán mạnh trong không khí;</p>
              <p><strong>g.</strong> Lựa chọn quần áo rộng và các chất liệu phù hợp vì vải và các thuốc nhuộm vải cũng là nguồn gây dị ứng;</p>
              <p><strong>h.</strong> Không phơi quần áo ngoài trời vì có khả năng phấn hoa có thể bám vào quần áo;</p>
              <p><strong>i.</strong> Cần thông báo và tư vấn bác sỹ trước khi dùng thuốc đối với những người có biểu hiện dị ứng.</p>
              <p><strong>j.</strong> Nếu tất cả các biện pháp trên không hiệu quả cần đi khám bác sỹ để được tư vấn.</p>
            </div>
          </div>
          <p>
            <strong>4.</strong> Nếu phát hiện ra có biểu hiện dị ứng hay tiếp xúc với nguồn gây dị ứng cần nhanh chóng tẩy rửa bằng nước sạch để loại bỏ hoặc làm loãng các chất dị ứng đã tiếp xúc với cơ thể.
          </p>
          <p>
            <strong>5.</strong> Không nên tự dùng thuốc tây đặc biệt là thuốc đông y chống dị ứng vì nhiều loại thực vật là nguồn chứa các chất gây dị ứng. Hiện nay có nhiều liệu pháp điều trị dị ứng kể cả tiêm ngừa dị ứng tuy vậy cần tuân thủ chặt chẽ sự hướng dẫn của các bác sỹ chuyên ngành da liễu.
          </p>
        </div>
      </div>

      <div className="text-center text-[10px] text-slate-400 font-mono pt-3 border-t border-slate-200">
        GOLAB CLINICAL LABORATORY • HƯỚNG DẪN PHÒNG NGỪA DỊ ỨNG • TRANG {totalPages}
      </div>
    </div>
  );
}

export default memo(AllergenGuidancePage);
