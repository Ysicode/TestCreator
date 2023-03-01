import { Injectable } from "@angular/core";
import { collection, collectionData, collectionGroup, deleteDoc, doc, Firestore, getDocs, onSnapshot, query, setDoc, updateDoc, where } from "@angular/fire/firestore";
import { Router } from "@angular/router";
import { getDoc } from "@firebase/firestore";
import { Observable } from "rxjs";


@Injectable({ providedIn: 'root' })

export class dataTransferService {
    loadedUserdata = [];
    loadedQuestions = [];
    subjectsAndClassesFromFirestore$: Observable<any>;
    questionsFromFirestore$: Observable<any>;
    testHeadFromFirestore$: Observable<any>;
    subUsersFromFirestore$: Observable<any>;
    subusers = [];
    currentTestHead: any;
    currentUserID: any;
    currentSchool: string = 'JonasWeiss';
    currentUserData$: Observable<any>;
    currentUserData: any;

    testschool: any;

    //Athentication
    // currentPassword: string = '54321';
    // currentEmailAdress: string = 'jonas@gmail.com';

    // loaded = false;
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
            return true;
        } else {
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
            querySnapshot.forEach((doc) => {
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



    // ADD SUBUSER
    async addNewSubUser(sub_user_email: string, sub_user_password: string, sub_user_firstname: string, sub_user_lastname: string) {
        const coll: any = collection(this.firestore, 'users', this.currentSchool, 'subusers');
        setDoc(doc(coll), {
            email: sub_user_email,
            password: sub_user_password, //Variable - wird später geändert durch den Admin beim anlegen von neuen unterusern
            firstname: sub_user_firstname,
            lastname:  sub_user_lastname,
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
        console.log("Document data:", schoolData.data());
    }


    /**
    * This function is used to delete a question form firebase
    * @param id is the firebase id of the question to delete it
    */
    deletedata(id: string) {
        const coll: any = doc(this.firestore, 'users', this.currentSchool, 'fragen' + id);
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