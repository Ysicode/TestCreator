import { Injectable } from "@angular/core";
import { collection, collectionData, collectionGroup, deleteDoc, doc, Firestore, getDocs, onSnapshot, query, setDoc, updateDoc, where } from "@angular/fire/firestore";
import { Router } from "@angular/router";
import { getDoc } from "@firebase/firestore";
import { Observable } from "rxjs";


@Injectable({ providedIn: 'root' })

export class dataTransferService {
    loadedUserdata = [];
    loadedSubUserData = [];
    loadedQuestions = [];
    loadedSchoolData: any;

    subjectsAndClassesFromFirestore$: Observable<any>;
    questionsFromFirestore$: Observable<any>;
    testHeadFromFirestore$: Observable<any>;
    subUsersFromFirestore$: Observable<any>;

    currentTestHead: any;
    currentUserID: any;
    currentSchool: string = 'JonasWeiss';
    currentSchoolType: string;
    currentUserData$: Observable<any>;
    currentUserData: any;

    public loaded: boolean = false;

    constructor(private firestore: Firestore, private router: Router) { }

    //At Login this function checks if the school exists
    async checkIfSchoolExists(input: any) {
        // input.toLowerCase();
        let schoolId = input.replace(/\s/g, '')
        const docRef = doc(this.firestore, "users", schoolId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            console.log("Document data:", docSnap.data(), 'ID', docSnap.id);
            this.currentSchool = docSnap.id;
            localStorage.setItem('school', JSON.stringify({
              school: this.currentSchool
            }));
            return true;
        } else {
            localStorage.removeItem('school');
            return false
        }
    }

    // this function checks if a user with this password and email adress exists
    async checkIfUserExists(password: string, email: string) {
        let login_successfull = false;
        const coll: any = collection(this.firestore, 'users', this.currentSchool, 'subusers');
        try {
            const q = query(coll, where("password", "==", password), where("email", "==", email)) //Collection abfrage nach password und Username
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                login_successfull = false;
            }
            querySnapshot.forEach((doc: any) => {
                // doc.data() is never undefined for query doc snapshots
                console.log('BINGO', doc.id, " => ", doc.data());
                this.currentUserID = doc.id;
                this.currentUserData = doc.data();
                login_successfull = true;
                this.saveUserDataToLocalStorage();
            });
        } catch (e) {
            console.log("Error getting cached document:", e);
        }
        return login_successfull
    }

    //saves user to local storage
    saveUserDataToLocalStorage() {
        const now = new Date();
        const expiration = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
        localStorage.setItem('session', JSON.stringify({
            sessionId: this.currentUserID,
            school: this.currentSchool,
            expiration
        }));
    }

    // gets userData from local storage
    getUserDataFromLocalStorage() {
        const data = localStorage.getItem('session');
        if (!data) {
            this.router.navigate(['login']);
            return null
        }

        const { sessionId, school, expiration } = JSON.parse(data);
        const now = new Date();
        if (now.getTime() > new Date(expiration).getTime()) {
            localStorage.removeItem('session');
            this.router.navigate(['login']);
            return null;
        }

        this.currentSchool = school;
        this.currentUserID = sessionId;
        this.saveUserDataToLocalStorage();
        return true;
    }

    logoutUser() {
        localStorage.removeItem('session');
        this.router.navigate(['login']);
    }

    /**
      * this function is used to load all subject and classes from firebase
      * and store it in a local object (loadedUserData)
      */
    async loadSubjectsAndClasses() {
        //gets UserData like classes and subjects and email adress and username
        const subject: any = collection(this.firestore, 'users', this.currentSchool, 'subjects');
        this.subjectsAndClassesFromFirestore$ = collectionData(subject, { idField: 'id' });
        this.subjectsAndClassesFromFirestore$.subscribe((data) => {
            this.loadedUserdata = data;
        });
    }

    getName() {
        return this.loaded
    }


    //LOAD ALL QUESTIONS
    async loadQuestions() {
        //gets all questions
        const coll: any = collection(this.firestore, 'users', this.currentSchool, 'fragen');
        this.questionsFromFirestore$ = collectionData(coll, { idField: 'id' })
        this.questionsFromFirestore$.subscribe((data) => {
            this.loadedQuestions = data;
            this.loadedQuestions.sort((x, y) => {
                return y.frage.time - x.frage.time

            })
        });
    }

    //LOAD ALL SubUsers
    async loadSubUsers() {
        //gets all questions
        const coll: any = collection(this.firestore, 'users', this.currentSchool, 'subusers');
        this.subUsersFromFirestore$ = collectionData(coll, { idField: 'id' })
        this.subUsersFromFirestore$.subscribe((data) => {
            this.loadedSubUserData = data;
            // this.loadedSubUserData.sort((x, y) => {
            //     return x.frage.time - y.frage.time 
            // })
        });
    }



    // ADD SUBUSER
    async addNewSubUser(newUser: any) {
        const coll: any = collection(this.firestore, 'users', this.currentSchool, 'subusers');
        setDoc(doc(coll), {
            email: newUser.email,
            password: newUser.password, //Variable - wird später geändert durch den Admin beim anlegen von neuen unterusern
            firstname: newUser.firstname,
            lastname: newUser.lastname,
            usertype: 'user',  //Variable - wird später geändert durch den Admin beim anlegen von neuen unterusern
            testhead: {
                schoolname: 'Schulname',
                testname: 'Testname',
                slogan: 'Viel Erfolg',
                totaltime: 0
            },
            classes: [],
            subjects: []
        });
    }

    editSubuserData(data: any, newAdminIsChecked: Boolean, userId: string) {
        const coll: any = doc(this.firestore, 'users', this.currentSchool, 'subusers', userId);
        updateDoc(coll, {
            firstname: data.firstname,
            lastname: data.lastname,
            password: data.password,
            email: data.email,
            usertype: 'user'
        });

        if (newAdminIsChecked) {
            updateDoc(coll, {
                usertype: 'admin'
            });
        }
    }

    /**
   * This function is used to delete a question form firebase
   * @param id is the firebase id of the question to delete it
   */
    deleteSubuser(userId: string) {
        const coll: any = doc(this.firestore, 'users', this.currentSchool, 'subusers', userId);
        deleteDoc(coll);
    }


    // UPDATE SUBUSER
    async updateSubUserData(password: string, username: string) {
        const docRef = doc(this.firestore, 'users', this.currentSchool, 'subusers', this.currentUserID); //ID und Schule müssen später variable sein
        updateDoc((docRef), {
            password: password, //Variable - wird später geändert durch den Admin beim anlegen von neuen unterusern
            username: username, //Variable - wird später geändert durch den Admin beim anlegen von neuen unterusern
        })

        onSnapshot(docRef, (doc: any) => { // Snapshot detect changes made to the doc. So wenn sie ändert in echtzeit
            this.currentUserData = doc.data();
            this.currentUserID = doc.id;
        });
    }

    // UPDATE SUBUSER CLASSES AND SUBJECTS ON CLICK IN ACCOUNT
    updateSubUserSubjectsAndClasses() {
        const coll: any = doc(this.firestore, 'users', this.currentSchool, 'subusers', this.currentUserID);
        updateDoc(coll, {
            classes: this.currentUserData['classes'],
            subjects: this.currentUserData['subjects']
        })
    }

    /**
    * This function is used to update firestore with the new data from an input field
    */
    updateUserSubjectsAndClasses() {
        const coll: any = doc(this.firestore, 'users', this.currentSchool, 'subjects', this.loadedUserdata[0]['id']);
        updateDoc(coll, {
            classes: this.loadedUserdata[0]['classes'],
            subjects: this.loadedUserdata[0]['subjects']
        })
    }


    //LOAD SUBUSERDATA
    async loadSubUserData() {
        const docRef = doc(this.firestore, 'users', this.currentSchool, 'subusers', this.currentUserID); //ID und Schule müssen später variable sein
        const subUserData = await getDoc(docRef);
        this.currentUserData = subUserData.data();

        onSnapshot(docRef, (doc: any) => { // Snapshot detect changes made to the doc. So wenn sie ändert in echtzeit
            this.currentUserData = doc.data();
            // this.currentUserID = doc.id;
        });
        setTimeout(() => {
            this.loaded = true;
        }, 500);

    }



    //LOAD SCHOOL DATA
    async loadUSchoolData() {
        const docRef: any = doc(this.firestore, 'users', this.currentSchool); // muss variabel sein je nachdem welche Schule ausgewählt wird
        const schoolData = await getDoc(docRef);
        this.loadedSchoolData = schoolData.data();
        console.log("Document data:", this.loadedSchoolData);
    }


    /**
    * This function is used to delete a question form firebase
    * @param id is the firebase id of the question to delete it
    */
    deletedata(id: string) {
        const coll: any = doc(this.firestore, 'users', this.currentSchool, 'fragen', id);
        deleteDoc(coll);
    }

    log(id: string) {
        console.log(id);
    }



    logID(id: string) {
        console.log(id)
    }






    // async loadTestHead() {
    //     console.log(this.currentUserID)
    //     const docRef: any = doc(this.firestore, 'users', 'JonasWeiss', 'subusers/' + this.currentUserID)
    //     const userData = await getDoc(docRef);
    //     this.currentUserData = userData.data();
    //     console.log(this.currentUserData);
    // }

    // /**
    //  * This function is used to load the current testHead from firebase
    //  * and store it in a local object (currenttestHead)
    //  */
    // async loadtestHead() {
    //     const testHead: any = collection(this.firestore, 'users', 'JonasWeiss', 'testHead');
    //     this.testHeadFromFirestore$ = collectionData(testHead);
    //     this.testHeadFromFirestore$.subscribe((data) => {
    //         this.currentTestHead = data;
    //     });
    // }

}