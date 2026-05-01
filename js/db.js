/* ══════════════════════════════════════════════
   SYNTAX SYNDICATE — FIRESTORE HELPERS
   CRUD · Realtime Listeners · Query Builder
   ══════════════════════════════════════════════ */

const DB = {
  /* ── CREATE ── */
  async addDoc(collectionPath, data) {
    data.created_at = firebase.firestore.FieldValue.serverTimestamp();
    const ref = await db.collection(collectionPath).add(data);
    return ref.id;
  },

  async setDoc(docPath, data, merge = true) {
    data.updated_at = firebase.firestore.FieldValue.serverTimestamp();
    await db.doc(docPath).set(data, { merge });
  },

  /* ── READ ── */
  async getDoc(docPath) {
    const snap = await db.doc(docPath).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  },

  async getDocs(collectionPath) {
    const snap = await db.collection(collectionPath).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async queryDocs(collectionPath, filters = [], orderByField = null, orderDir = 'desc', limitCount = 50) {
    let ref = db.collection(collectionPath);
    for (const [field, op, val] of filters) {
      ref = ref.where(field, op, val);
    }
    if (orderByField) ref = ref.orderBy(orderByField, orderDir);
    if (limitCount) ref = ref.limit(limitCount);
    const snap = await ref.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  /* ── UPDATE ── */
  async updateDoc(docPath, data) {
    data.updated_at = firebase.firestore.FieldValue.serverTimestamp();
    await db.doc(docPath).update(data);
  },

  /* ── DELETE ── */
  async deleteDoc(docPath) {
    await db.doc(docPath).delete();
  },

  /* ── REALTIME LISTENERS ── */
  listenToCollection(collectionPath, callback, filters = [], orderByField = null, orderDir = 'desc') {
    let ref = db.collection(collectionPath);
    for (const [field, op, val] of filters) {
      ref = ref.where(field, op, val);
    }
    if (orderByField) ref = ref.orderBy(orderByField, orderDir);
    return ref.onSnapshot(snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(docs);
    });
  },

  listenToDoc(docPath, callback) {
    return db.doc(docPath).onSnapshot(snap => {
      callback(snap.exists ? { id: snap.id, ...snap.data() } : null);
    });
  },

  /* ── USER PROFILE ── */
  async getUserProfile(uid) {
    return this.getDoc(`users/${uid}`);
  },

  async updateUserProfile(uid, data) {
    return this.updateDoc(`users/${uid}`, data);
  },

  /* ── INCREMENT FIELD ── */
  async incrementField(docPath, field, amount = 1) {
    await db.doc(docPath).update({
      [field]: firebase.firestore.FieldValue.increment(amount)
    });
  },

  /* ── ARRAY HELPERS ── */
  async addToArray(docPath, field, value) {
    await db.doc(docPath).update({
      [field]: firebase.firestore.FieldValue.arrayUnion(value)
    });
  },

  async removeFromArray(docPath, field, value) {
    await db.doc(docPath).update({
      [field]: firebase.firestore.FieldValue.arrayRemove(value)
    });
  },

  /* ── OPPORTUNITIES ECOSYSTEM ── */
  COLS: {
    JOBS: 'ss_jobs',
    INTERNSHIPS: 'ss_internships',
    HACKATHONS: 'ss_hackathons',
    TECH_EVENTS: 'ss_techEvents',
    SEMINARS: 'ss_seminars',
    COURSES: 'ss_courses',
    ADS: 'ss_ads'
  },

  async fetchAllOpportunities(limitPerCol = null) {
    const categories = Object.values(this.COLS).filter(c => c !== 'ss_ads');
    const results = await Promise.all(categories.map(async col => {
      try {
        let ref = db.collection(col).orderBy('postedAt', 'desc');
        if (limitPerCol) ref = ref.limit(limitPerCol);
        const snap = await ref.get();
        return snap.docs.map(d => ({ id: d.id, _collection: col, ...d.data() }));
      } catch(e) {
        try {
          let ref = db.collection(col);
          if (limitPerCol) ref = ref.limit(limitPerCol);
          const snap = await ref.get();
          return snap.docs.map(d => ({ id: d.id, _collection: col, ...d.data() }));
        } catch(e2) {
          return [];
        }
      }
    }));

    // Flatten and sort globally by date
    return results.flat().sort((a, b) => {
      const dateA = a.postedAt?.toDate?.() || new Date(0);
      const dateB = b.postedAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
  },

  /* ── ROADMAPS ── */
  async fetchLatestRoadmaps(limit = 6) {
    const snap = await db.collection('roadmaps').orderBy('created_at', 'desc').limit(limit).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async fetchFeaturedRoadmaps(limit = 6) {
    try {
      const snap = await db.collection('roadmaps').where('is_featured', '==', true).orderBy('created_at', 'desc').limit(limit).get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch(e) { return this.fetchLatestRoadmaps(limit); }
  },

  async fetchRoadmap(id) {
    return this.getDoc(`roadmaps/${id}`);
  },

  async saveRoadmap(data, id = null) {
    if (id) {
      await this.updateDoc(`roadmaps/${id}`, data);
      return id;
    }
    return this.addDoc('roadmaps', data);
  },

  async deleteRoadmap(id) {
    return this.deleteDoc(`roadmaps/${id}`);
  },

  /* ── CHEATSHEETS ── */
  async fetchLatestCheatsheets(limit = 6) {
    const snap = await db.collection('cheatsheets').orderBy('created_at', 'desc').limit(limit).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async fetchCheatsheet(id) {
    return this.getDoc(`cheatsheets/${id}`);
  },

  async saveCheatsheet(data, id = null) {
    if (id) {
      await this.updateDoc(`cheatsheets/${id}`, data);
      return id;
    }
    return this.addDoc('cheatsheets', data);
  },

  async deleteCheatsheet(id) {
    return this.deleteDoc(`cheatsheets/${id}`);
  },

  /* ── PDF LIBRARY ── */
  async fetchPdf(id) {
    return this.getDoc(`pdfs/${id}`);
  },

  async fetchFreePdfs(limitCount = 100) {
    // Avoid composite index by fetching all pdfs and filtering client-side
    try {
      const snap = await db.collection('pdfs').orderBy('created_at', 'desc').limit(300).get();
      const all = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return all.filter(p => p.access === 'free').slice(0, limitCount);
    } catch(e) {
      // Fallback: no ordering if even that fails
      const snap = await db.collection('pdfs').get();
      const all = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return all.filter(p => p.access === 'free').slice(0, limitCount);
    }
  },

  async fetchAllPdfs(limitCount = 200) {
    try {
      const snap = await db.collection('pdfs').orderBy('created_at', 'desc').limit(limitCount).get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch(e) {
      const snap = await db.collection('pdfs').get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  },

  async savePdf(data, id = null) {
    if (id) {
      await this.updateDoc(`pdfs/${id}`, data);
      return id;
    }
    return this.addDoc('pdfs', data);
  },

  async deletePdf(id) {
    return this.deleteDoc(`pdfs/${id}`);
  },

  /* ── REVIEWS ── */
  async fetchReviews(pdfId, limitCount = 50) {
    // Avoid composite index by fetching all reviews for this pdf
    try {
      const snap = await db.collection('reviews').where('pdf_id', '==', pdfId).limit(limitCount).get();
      const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort client-side by created_at descending
      reviews.sort((a, b) => {
        const da = a.created_at?.toDate?.() || new Date(0);
        const db2 = b.created_at?.toDate?.() || new Date(0);
        return db2 - da;
      });
      return reviews;
    } catch(e) { return []; }
  },

  async submitReview(pdfId, reviewData) {
    // Add the review
    reviewData.pdf_id = pdfId;
    reviewData.created_at = firebase.firestore.FieldValue.serverTimestamp();
    await db.collection('reviews').add(reviewData);

    // Recalculate avg_rating on the PDF document
    try {
      const allReviews = await this.fetchReviews(pdfId, 500);
      const avgRating = allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / allReviews.length;
      await db.doc(`pdfs/${pdfId}`).update({
        avg_rating: Math.round(avgRating * 10) / 10,
        review_count: allReviews.length
      });
    } catch(e) { console.error('Failed to update avg_rating:', e); }
  },

  /* ── NOTIFICATIONS ── */
  async addNotification(data) {
    data.created_at = firebase.firestore.FieldValue.serverTimestamp();
    data.read = false;
    return db.collection('notifications').add(data);
  },

  async broadcastNotification(data) {
    // Send to all users
    data.target = 'all';
    return this.addNotification(data);
  },

  async sendNotificationToUser(userId, data) {
    data.target_user = userId;
    data.target = 'user';
    return this.addNotification(data);
  },

  async fetchUserNotifications(userId, limitCount = 20) {
    try {
      // Fetch notifications targeted at this user OR broadcast to all
      const userSnap = await db.collection('notifications')
        .where('target_user', '==', userId).limit(limitCount).get();
      const broadSnap = await db.collection('notifications')
        .where('target', '==', 'all').limit(limitCount).get();

      const all = [
        ...userSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        ...broadSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      ];
      // Deduplicate and sort
      const seen = new Set();
      const unique = all.filter(n => { if (seen.has(n.id)) return false; seen.add(n.id); return true; });
      unique.sort((a, b) => {
        const da = a.created_at?.toDate?.() || new Date(0);
        const db2 = b.created_at?.toDate?.() || new Date(0);
        return db2 - da;
      });
      return unique.slice(0, limitCount);
    } catch(e) { return []; }
  },

  async markNotificationRead(notifId) {
    await db.doc(`notifications/${notifId}`).update({ read: true });
  },

  /* ── CONTACT MESSAGES ── */
  async submitContactForm(data) {
    data.status = 'unread';
    return this.addDoc('contact_messages', data);
  },

  async fetchContactMessages() {
    const snap = await db.collection('contact_messages').orderBy('created_at', 'desc').limit(100).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async markMessageRead(id) {
    return this.updateDoc(`contact_messages/${id}`, { status: 'read' });
  },

  async deleteMessage(id) {
    return this.deleteDoc(`contact_messages/${id}`);
  },

  /* ── COMPANY PROFILES ── */
  async fetchCompanyProfile(uid) {
    return this.getDoc(`users/${uid}`);
  },

  async fetchCompanyContent(uid, type = null, status = 'approved') {
    let filters = [['posted_by', '==', uid]];
    if (type) filters.push(['type', '==', type]);
    if (status) filters.push(['status', '==', status]);
    return this.queryDocs('pending_content', filters, 'created_at', 'desc', 50);
  },

  async fetchCompanyRoadmaps(uid) {
    try {
      return await this.queryDocs('roadmaps', [['posted_by', '==', uid]], 'created_at', 'desc', 50);
    } catch(e) {
      const docs = await this.queryDocs('roadmaps', [['posted_by', '==', uid]], null, null, 100);
      return docs.sort((a,b) => (b.created_at?.toMillis?.() || 0) - (a.created_at?.toMillis?.() || 0));
    }
  },

  async fetchCompanyCheatsheets(uid) {
    try {
      return await this.queryDocs('cheatsheets', [['posted_by', '==', uid]], 'created_at', 'desc', 50);
    } catch(e) {
      const docs = await this.queryDocs('cheatsheets', [['posted_by', '==', uid]], null, null, 100);
      return docs.sort((a,b) => (b.created_at?.toMillis?.() || 0) - (a.created_at?.toMillis?.() || 0));
    }
  },

  async fetchCompanyPdfs(uid) {
    try {
      return await this.queryDocs('pdfs', [['posted_by', '==', uid]], 'created_at', 'desc', 50);
    } catch(e) {
      const docs = await this.queryDocs('pdfs', [['posted_by', '==', uid]], null, null, 100);
      return docs.sort((a,b) => (b.created_at?.toMillis?.() || 0) - (a.created_at?.toMillis?.() || 0));
    }
  },

  async fetchCompanyOpportunities(uid) {
    const categories = Object.values(this.COLS).filter(c => c !== 'ss_ads');
    const results = await Promise.all(categories.map(async col => {
      try {
        const snap = await db.collection(col).where('posted_by', '==', uid).orderBy('postedAt', 'desc').limit(20).get();
        return snap.docs.map(d => ({ id: d.id, _collection: col, ...d.data() }));
      } catch(e) { 
        try {
          const snap = await db.collection(col).where('posted_by', '==', uid).limit(50).get();
          const docs = snap.docs.map(d => ({ id: d.id, _collection: col, ...d.data() }));
          return docs.sort((a,b) => (b.postedAt?.toMillis?.() || 0) - (a.postedAt?.toMillis?.() || 0));
        } catch(e2) { return []; }
      }
    }));
    return results.flat();
  },

  /* ── DEVHUB — Homepage ── */
  async fetchLatestDevhubPosts(limit = 4) {
    const snap = await db.collection('devhub_posts').orderBy('created_at', 'desc').limit(limit).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  /* ── PDF LIBRARY — Homepage ── */
  async fetchLatestPDFs(limit = 6) {
    try {
      const snap = await db.collection('pdfs').orderBy('created_at', 'desc').limit(limit).get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch(e) { return []; }
  },

  /* ── PREMIUM PROJECTS ── */
  async fetchPremiumProjects(limit = 50) {
    const snap = await db.collection('premium_projects').orderBy('created_at', 'desc').limit(limit).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async savePremiumProject(data, id = null) {
    data.updated_at = firebase.firestore.FieldValue.serverTimestamp();
    if (id) {
      await db.collection('premium_projects').doc(id).set(data, { merge: true });
      return id;
    } else {
      data.created_at = firebase.firestore.FieldValue.serverTimestamp();
      const ref = await db.collection('premium_projects').add(data);
      return ref.id;
    }
  },

  async deletePremiumProject(id) {
    await db.collection('premium_projects').doc(id).delete();
  },

  /* ── RESUME BUILDER ── */
  async saveResume(uid, data) {
    data.updated_at = firebase.firestore.FieldValue.serverTimestamp();
    await db.collection('resumes').doc(uid).set(data, { merge: true });
  },
  async getResume(uid) {
    return this.getDoc(`resumes/${uid}`);
  },
  async deleteResume(uid) {
    await db.collection('resumes').doc(uid).delete();
  },

  /* ── PORTFOLIO BUILDER ── */
  async savePortfolio(uid, data) {
    data.updated_at = firebase.firestore.FieldValue.serverTimestamp();
    await db.collection('portfolios').doc(uid).set(data, { merge: true });
  },
  async getPortfolio(uid) {
    return this.getDoc(`portfolios/${uid}`);
  },
  async getPublicPortfolio(uid) {
    const doc = await this.getDoc(`portfolios/${uid}`);
    if (doc && doc.is_published) return doc;
    return null;
  },
  async publishPortfolio(uid, flag) {
    await db.collection('portfolios').doc(uid).update({ is_published: flag });
  }
};

window.DB = DB;
