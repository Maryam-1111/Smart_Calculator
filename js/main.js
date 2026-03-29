const { createApp } = Vue;

createApp({
  data() {
    return {
      text: "",
      result: null,
      loading: false,
      showCamera: false,
      stream: null,
      ignoreWords: ["كيلو", "كجم", "ك", "kg", "g", "جرام"],
    };
  },

  computed: {
    // تحويل الناتج لأرقام عربية
    resultArabic() {
      if (this.result === null) return "";
      const map = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
      return this.result.toString().replace(/\d/g, (d) => map[d]);
    },
  },

  methods: {
    // تحويل الأرقام العربية لإنجليزي
    normalizeNumbers(text) {
      const map = {
        "٠": "0",
        "١": "1",
        "٢": "2",
        "٣": "3",
        "٤": "4",
        "٥": "5",
        "٦": "6",
        "٧": "7",
        "٨": "8",
        "٩": "9",
      };
      return text.replace(/[٠-٩]/g, (d) => map[d]);
    },

    async pasteText() {
      try {
        const txt = await navigator.clipboard.readText();
        this.text = txt;
      } catch {
        alert("فشل الوصول للنص المنسوخ");
      }
    },

    calculate() {
      let normalized = this.normalizeNumbers(this.text);
      const lines = normalized.split("\n");

      let total = 0;

      lines.forEach((line) => {
        const words = line.split(/\s+/);

        // نحدد الكلمات اللي تعتبر وحدات
        const unitWords = this.ignoreWords;

        for (let i = 0; i < words.length; i++) {
          if (unitWords.includes(words[i])) {
            // نحذف الرقم اللي قبلها فقط (بدون التأثير على باقي السطر)
            if (i > 0 && /^\d+$/.test(words[i - 1])) {
              words[i - 1] = "";
            }
          }
        }

        // إعادة بناء السطر
        const cleanedLine = words.join(" ");

        // استخراج كل الأرقام المتبقية في السطر
        const matches = cleanedLine.match(/\d+/g);

        if (matches) {
          matches.forEach((n) => {
            total += Number(n);
          });
        }
      });

      this.result = total;
    },

    async startCamera() {
      this.showCamera = true;
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.$refs.video.srcObject = this.stream;
    },

    captureImage() {
      const video = this.$refs.video;
      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0);

      this.stream.getTracks().forEach((track) => track.stop());
      this.showCamera = false;

      this.runOCR(canvas);
    },

    async runOCR(canvas) {
      this.loading = true;

      const {
        data: { text },
      } = await Tesseract.recognize(canvas, "eng+ara");

      this.text = text;
      this.loading = false;
    },

    clearAll() {
      this.text = "";
      this.result = null;
    },
  },
}).mount("#app");
